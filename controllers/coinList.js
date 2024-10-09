import {CoinList} from '../db/mysql.js' // 更新 import 路徑
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
            
            // 更新緩存，只儲存最新的資料
            this.coinDataBuffer[symbol] = {
                price: parseFloat(price),
                trading_volume_usdt: parseFloat(price) * parseFloat(trading_volume)
            };

            // console.log(`Updated cache for ${symbol}: Price = ${price}, Volume = ${trading_volume}`);
        } catch (error) {
            console.error('Error processing WebSocket data:', error)
        }
    }

    // 初始化定期更新機制
    initUpdateProcess() {
        setInterval(async () => {
            // 依據緩存中的資料進行批量更新操作
            for (const symbol in this.coinDataBuffer) {
                const { price, trading_volume_usdt } = this.coinDataBuffer[symbol]

                try {
                    // 單日價差
                    const past_DayPrice_raw = await readFile(`./data/klineSticks/1d/${symbol}.json`, 'utf-8')
                    const past_DayPrice_object = JSON.parse(past_DayPrice_raw);
                    const lastDayPrice = past_DayPrice_object[symbol][past_DayPrice_object[symbol].length - 1]
                    const price_change = price - lastDayPrice;

                    // 漲跌幅%
                    const change_rate = `${(price_change / lastDayPrice) * 100}%`

                    // 前一日交易量
                    const volume_24hr_raw = await readFile(`./data/dayVolumn/${symbol}.json`, 'utf-8')
                    const volume_24hr_array = JSON.parse(volume_24hr_raw);
                    const volume_24hr = volume_24hr_array[volume_24hr_array.length - 1]

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

                // 清除已處理的緩存資料
                delete this.coinDataBuffer[symbol]
            }
        }, this.updateInterval)
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
