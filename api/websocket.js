import WebSocket from 'ws'
import fs from 'fs'
import util from 'util'

const readFile = util.promisify(fs.readFile)

class BinanceWebSocket {
    constructor(url, pairsFilePath) {
        this.url = url
        this.pairsFilePath = pairsFilePath
        this.ws = null
        this.subscribePairs = []
    }

    async initialize() {
        const data = await readFile(this.pairsFilePath, "utf8")
        const usdtPairs = JSON.parse(data)

        // binance allow 1024 streams per subscribe,but actually 385 only
        // Each 300 pairs are divided into one group
        const groupedPairs = this.groupArray(usdtPairs, 300)
        this.subscribePairs = groupedPairs.map(group => 
            group.map(pair => `${pair.toLowerCase()}@trade`)
        )

        this.ws = new WebSocket(this.url)

        this.ws.on('open', () => this.onOpen())
        this.ws.on('message', data => this.onMessage(data))
        this.ws.on('close', (code, reason) => this.onClose(code, reason))
        this.ws.on('ping', data => this.onPing(data))
        this.ws.on('error', error => this.onError(error))
    }

    groupArray(array, groupSize) {
        const result = [];
        for (let i = 0; i < array.length; i += groupSize) {
            result.push(array.slice(i, i + groupSize));
        }
        return result;
    }

    onOpen() {
        console.log('Connected to Binance WebSocket')
        this.subscribePairs.forEach((subscribeGroup, index) => {
            this.subscribe({
                method: 'SUBSCRIBE',
                params: subscribeGroup,
                id: index + 1 // 每組有不同的 id
            });
        })
    }

    onMessage(data) {
        // 預設的處理方法，在子類別coinList.js中覆寫
        try {
            const parsedData = JSON.parse(data)
            const { s: symbol, p: price, q: trading_volume } = parsedData
            console.log(symbol, price, trading_volume)
            // 處理接收到的數據
        } catch (error) {
            console.error('Error parsing message:', error)
        }
    }

    onClose(code, reason) {
        console.log(`WebSocket Closed: Code ${code}, Reason ${reason}`)
        // 嘗試重新連接
        setTimeout(() => this.initialize(), 5000)
    }

    onPing(data) {
        console.log('Received ping:', data)
        this.ws.pong(data)
        console.log('Sent pong:', data)
    }

    onError(error) {
        console.error('WebSocket Error:', error)
    }

    subscribe(params) {
        this.ws.send(JSON.stringify(params))
    }
}

// const binanceWS = new BinanceWebSocket('wss://stream.binance.com:9443/ws', '../data/usdtPairs.json')
// await binanceWS.initialize()

export default BinanceWebSocket
