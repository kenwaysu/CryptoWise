import {User, CoinList, Order, History, Portfolio} from '../db/mysql.js' // 更新 import 路徑
import BinanceWebSocket from '../api/websocket.js'
import fs from 'fs'
import util from 'util'
const readFile = util.promisify(fs.readFile)

class CustomWebSocket extends BinanceWebSocket {
    constructor(url, pairsFilePath) {
        super(url, pairsFilePath)
        this.coinDataBuffer = {}  // 緩存每個幣種的最新資料
        this.updateInterval = 200 // 每0.2秒檢查和更新資料
        this.initUpdateProcess()  // 啟動定期更新機制
    }

    async onMessage(data) {
        try {
            const parsedData = JSON.parse(data);
            const { s: symbol, p: price, q: trading_volume } = parsedData;
            const trading_volume_usdt = price * trading_volume
            // 更新緩存，只儲存最新的資料
            this.coinDataBuffer[symbol] = {
                price: parseFloat(price),
                trading_volume_usdt: trading_volume_usdt
            };

            // console.log(`Updated cache for ${symbol}: Price = ${price}, Volume = ${trading_volume}`);
        } catch (error) {
            console.error('Error processing WebSocket data:', error)
        }
    }

    // 初始化定期更新機制
    initUpdateProcess() {
        setInterval(async () => {
            await this.updateCoinPrice()
            await this.updateProfit_loss()
            await this.orderExecution()
            await this.updateUserAsset()
            
        }, this.updateInterval)
    }

    async updateCoinPrice() {
        for (const symbol in this.coinDataBuffer) {
            const { price, trading_volume_usdt } = this.coinDataBuffer[symbol]
    
            try {
                // 單日價差
                const past_DayPrice_raw = await readFile(`./data/klineSticks/1d/${symbol}.json`, 'utf-8')
                const past_DayPrice_object = JSON.parse(past_DayPrice_raw);
                const lastDayPrice = past_DayPrice_object[symbol][past_DayPrice_object[symbol].length - 1]
                const price_change = price - lastDayPrice;
    
                // 漲跌幅%
                const change_rate = `${((price_change / lastDayPrice) * 100).toFixed(2)}%`
    
                // 前一日交易量
                const volume_24hr_raw = await readFile(`./data/dayVolumn/${symbol}.json`, 'utf-8')
                const volume_24hr_array = JSON.parse(volume_24hr_raw);
                const volume_24hr = volume_24hr_array[volume_24hr_array.length - 2]
    
                // 更新或插入資料至資料庫
                await CoinList.upsert({
                    coin: symbol.toUpperCase(),
                    price,
                    trading_volume: trading_volume_usdt,
                    price_change,
                    change_rate,
                    volume_24hr
                });
    
                // console.log(`Upserted trade data for ${symbol}`);
            } catch (error) {
                console.error(`Error upserting trade data for ${symbol}:`, error)
            }
    
            // // 清除已處理的緩存資料
            delete this.coinDataBuffer[symbol]
        }
    }

    async orderExecution() {
        const pendingOrders = await Order.findAll({
            order: [
                ['UserId', 'ASC'],
                ['CoinListId', 'ASC'],
                ['order_type', 'ASC'],
                ['order_price', 'DESC'],
                ['createdAt', 'ASC']
            ],
            include: [{
                model: CoinList,
                attributes: ['coin']
            }]
        });
    
        for (const order of pendingOrders) {
            const symbol = order.CoinList.coin;
            const currentMarketData = this.coinDataBuffer[symbol];
    
            if (!currentMarketData) continue;
    
            const { price: marketPrice, trading_volume_usdt: marketVolume } = currentMarketData;
            if (marketVolume < 1) continue
            let executionVolume = 0;
            let executionValue = 0;
            let executionPrice = order.order_price;
    
            const canExecute = (order.order_type === 'BUY' && order.order_price >= marketPrice) ||
                               (order.order_type === 'SELL' && order.order_price <= marketPrice);
    
            if (canExecute) {
                executionValue = Math.min(order.order_value, marketVolume);
                executionVolume = executionValue / executionPrice;
    
                // 更新訂單
                if (executionValue >= order.order_value) {
                    // 完全成交
                    await order.destroy();
                } else {
                    // 部分成交
                    order.order_volume -= executionVolume;
                    order.order_value -= executionValue;
                    await order.save();
                }
    
                // 創建交易歷史記錄
                await History.create({
                    UserId: order.UserId,
                    CoinListId: order.CoinListId,
                    order_type: order.order_type,
                    trade_volume: executionVolume,
                    trade_price: executionPrice,
                    trade_value: executionValue
                });
    
                // 更新市場數據緩存
                if (!this.coinDataBuffer[symbol]) {
                    this.coinDataBuffer[symbol] = { price: 0, trading_volume_usdt: 0 }
                }else{
                    this.coinDataBuffer[symbol].trading_volume_usdt -= executionValue
                }
            }
    
            // 無論訂單是否執行，都更新投資組合
            await this.updatePortfolio(order.UserId, order.CoinListId, marketPrice, executionVolume, executionPrice, order.order_type);
        }
    }
    
    async updatePortfolio(userId, coinListId, marketPrice, executionVolume = 0, executionPrice = 0, orderType = null) {
        const portfolio = await Portfolio.findOne({
            where: { UserId: userId, CoinListId: coinListId }
        });
        const user = await User.findByPk(userId);
    
        if (!user) {
            throw new Error('User not found');
        }
    
        if (portfolio) {
            if (orderType === 'BUY' && executionVolume > 0) {
                const executionValue = executionVolume * executionPrice;
                portfolio.total_cost += executionValue;
                portfolio.total_volume += executionVolume;
                user.cash_balance -= executionValue;
            } else if (orderType === 'SELL' && executionVolume > 0) {
                const executionValue = executionVolume * executionPrice;
                portfolio.total_cost -= (portfolio.average_cost * executionVolume);
                portfolio.total_volume -= executionVolume;
                user.cash_balance += executionValue;
            }
    
            if (portfolio.total_volume > 0) {
                portfolio.average_cost = portfolio.total_cost / portfolio.total_volume;
            } else {
                portfolio.average_cost = 0;
            }
    
            portfolio.current_value = portfolio.total_volume * marketPrice;
            portfolio.profit_loss = portfolio.current_value - portfolio.total_cost;
        } else if (executionVolume > 0) {
            // 如果投資組合不存在，且有執行的交易，創建新的
            await Portfolio.create({
                UserId: userId,
                CoinListId: coinListId,
                total_volume: executionVolume,
                average_cost: executionPrice,
                total_cost: executionVolume * executionPrice,
                current_value: executionVolume * marketPrice,
                profit_loss: executionVolume * (marketPrice - executionPrice)
            });
    
            // 更新用戶現金餘額
            if (orderType === 'BUY') {
                user.cash_balance -= executionVolume * executionPrice;
            } else if (orderType === 'SELL') {
                user.cash_balance += executionVolume * executionPrice;
            }
        }
    
        // 保存更改
        await user.save();
        if (portfolio) {
            await portfolio.save();
        }
    }

    async updateProfit_loss() {
        try {
            // 獲取所有的投資組合記錄
            const portfolios = await Portfolio.findAll({
                include: [{
                    model: CoinList,
                    attributes: ['coin']
                }]
            })
    
            for (const portfolio of portfolios) {

                if(portfolio.total_volume < 0.0001){
                    await portfolio.destroy() 
                    continue
                }

                const symbol = portfolio.CoinList.coin;
                const currentMarketData = this.coinDataBuffer[symbol]
    
                if (currentMarketData) {
                    const { price: marketPrice } = currentMarketData
    
                    // 更新 current_value 和 profit_loss
                    portfolio.current_value = portfolio.total_volume * marketPrice
                    portfolio.profit_loss = portfolio.current_value - portfolio.total_cost
    
                    // 保存更新後的投資組合
                    await portfolio.save()
                }
                
            }
        } catch (error) {
            console.error('Error updating portfolios:', error)
        }
    }

    async updateUserAsset() {
        try {
            // 獲取所有用戶
            const users = await User.findAll();
    
            for (const user of users) {
                // 獲取用戶的投資組合
                const portfolio = await Portfolio.findAll({
                    where: { userId: user.id },
                });
    
                // 計算總持有價值
                let totalHoldingsValue = 0;
                for (const holding of portfolio) {
                    const currentValue = holding.current_value;
                    totalHoldingsValue += currentValue;
                }

                const totalAssets = user.cash_balance + totalHoldingsValue
    
                // 更新用戶的 holdings_value
                await User.update(
                    { 
                        holdings_value: totalHoldingsValue,
                        asset: totalAssets 
                    },
                    { where: { id: user.id } }
                );
            }

        } catch (error) {
            console.error('Error updating user assets:', error);
        }
    }

}

const wsUrl = 'wss://stream.binance.com:9443/ws'
const pairsFilePath = '../data/usdtPairs.json'

// 實例化 CustomWebSocket 類
const customWSInstance = new CustomWebSocket(wsUrl, pairsFilePath)

// 初始化 WebSocket 連接
customWSInstance.initialize().then(() => {
    console.log('CustomWebSocket instance initialized')
}).catch(error => {
    console.error('Error initializing CustomWebSocket:', error)
})
