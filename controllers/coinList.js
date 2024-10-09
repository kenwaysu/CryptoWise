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
            await this.orderExecution()
            
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
    
        if (portfolio) {
            if (orderType === 'BUY' && executionVolume > 0) {
                const executionValue = executionVolume * executionPrice;
                portfolio.total_cost += executionValue;
                portfolio.total_volume += executionVolume;
            } else if (orderType === 'SELL' && executionVolume > 0) {
                portfolio.total_cost -= (portfolio.average_cost * executionVolume);
                portfolio.total_volume -= executionVolume;
            }
    
            if (portfolio.total_volume > 0) {
                portfolio.average_cost = portfolio.total_cost / portfolio.total_volume;
            } else {
                portfolio.average_cost = 0;
            }
    
            portfolio.current_value = portfolio.total_volume * marketPrice;
            portfolio.profit_loss = portfolio.current_value - portfolio.total_cost;
            await portfolio.save();
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
        }
    }

    // async orderExecution() {
    //     try {
    //         // 先查詢所有使用者
    //         const users = await User.findAll();
    
    //         // 對於每一個使用者，處理他們的訂單
    //         for (const user of users) {
    //             // 查詢該使用者的所有訂單，並根據 CoinListId 分組
    //             const orders = await Order.findAll({
    //                 where: { UserId: user.id },
    //                 order: [
    //                     ['CoinListId', 'ASC'],  // 按幣種排序
    //                     ['order_type', 'ASC'],  // BUY 和 SELL 分類
    //                     ['order_price', 'DESC'],  // BUY: 價格越高優先
    //                     ['createdAt', 'ASC']     // 價格相同，先下單的優先
    //                 ]
    //             })
    //             let remainingVolume = user.availableVolume;
    
    //             for (const order of orders) {
    //                 const coinData = this.coinDataBuffer[order.CoinListId]; // 取得該幣的緩存數據
        
    //                 // 檢查訂單類型和價格
    //                 if (order.order_type === 'BUY' && coinData.price <= order.order_price) {
    //                     const volumeToExecute = Math.min(remainingVolume, order.order_volume)
        
    //                     if (volumeToExecute > 0) {
    //                         // 處理成交
    //                         remainingVolume -= volumeToExecute
    //                         // 更新資料庫中的訂單狀態，或其他處理邏輯
    //                         if (remainingVolume <= 0) {
    //                             // 完全成交，刪除訂單
    //                             await Order.destroy({
    //                                 where: { id: order.id }
    //                             });
    //                             console.log(`訂單 ${order.id} 完全成交並刪除`)

    //                     }
    //                 } else if (order.order_type === 'SELL' && coinData.price >= order.order_price) {
    //                     const volumeToExecute = Math.min(remainingVolume, order.order_volume)
        
    //                     if (volumeToExecute > 0) {
    //                         // 處理成交
    //                         remainingVolume -= volumeToExecute
    //                         // 更新資料庫中的訂單狀態，或其他處理邏輯
    //                     }
    //                 }
        
    //                 // 這裡可以檢查剩餘量是否為零，如果是，則可以停止處理該用戶的後續訂單
    //                 if (remainingVolume <= 0) break
    //             }
    //         }
    //         }
    //     } catch (error) {
    //         console.error("Order execution error:", error)
    //     }
    // }
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
