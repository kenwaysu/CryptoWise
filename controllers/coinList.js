import {CoinList} from '../db/mysql.js' // 更新 import 路徑
import BinanceWebSocket from '../api/websocket.js'
import fs from 'fs'
import util from 'util'
const readFile = util.promisify(fs.readFile)

class CustomWebSocket extends BinanceWebSocket{
    constructor(url, pairsFilePath){
        super(url, pairsFilePath)
    }

    async onMessage(data){
        try {
            const parsedData = JSON.parse(data)
            // 即時價錢和成交量
            const { s: symbol, 
                    p: price, 
                    q: trading_volume} = parsedData
    
            const trading_volume_usdt = price*trading_volume
    
            // 單日價差
            const past_DayPrice = await readFile(`./data/klineSticks/1d/${symbol}.json`, 'utf-8')
            const past_DayPrice_object = JSON.parse(past_DayPrice)
            const lastDayPrice = past_DayPrice_object[symbol][past_DayPrice_object[symbol].length - 1]
            const price_change = price - lastDayPrice
    
            // 漲跌幅%
            const change_rate = `${(price_change/lastDayPrice)*100}%`
    
            // 前一日交易量
            const volumn_24hr_raw = await readFile(`./data/dayVolumn/${symbol}.json`, 'utf-8')
            const volumn_24hr_array = JSON.parse(volumn_24hr_raw)
            const volumn_24hr = volumn_24hr_array[volumn_24hr_array.length - 1]
    
            // 使用upsert更新或插入資料
            await CoinList.upsert({
                coin: symbol.toUpperCase(),
                price: parseFloat(price),
                trading_volume: parseFloat(trading_volume_usdt),
                price_change: parseFloat(price_change) || 0,
                change_rate: parseFloat(change_rate) || '0%',
                volume_24hr: parseFloat(volumn_24hr) || 0
            })
    
            // console.log(`Upserted trade data for ${symbol}: Price = ${price}, Volume = ${trading_volume}`)
        } catch (error) {
            console.error('Error upserting trade data:', error)
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