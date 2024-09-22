import WebSocket from 'ws'
import fs from 'fs'
import util from 'util'



const readFile = util.promisify(fs.readFile)
const data = await readFile('../data/usdtPairs.json', "utf8")
const usdtPairs = JSON.parse(data)
const usdtPairsPart1 = usdtPairs.slice(0, 300)
const subscribePairs1 = usdtPairsPart1.map(pair => `${pair.toLowerCase()}@trade`)
// console.log(subscribePairs1)

const usdtPairsPart2 = usdtPairs.slice(300, usdtPairs.length)
const subscribePairs2 = usdtPairsPart2.map(pair => `${pair.toLowerCase()}@trade`)
// console.log(subscribePairs2)

async function initializeWebSocket() {
    const ws = new WebSocket('wss://stream.binance.com:9443/ws')

    ws.on('open', function open() {
        console.log('Connected to Binance WebSocket');
        // 訂閱報價通道
        const params1 = {
            method: 'SUBSCRIBE',
            params: subscribePairs1,
            id: 1
        }
        const params2 = {
            method: 'SUBSCRIBE',
            params: subscribePairs2,
            id: 2
        }
        ws.send(JSON.stringify(params1))
        ws.send(JSON.stringify(params2))
    })

    // ws.on('message', function incoming(data) {
    //     const parsedData = JSON.parse(data);
    //     const { s: symbol, p: price, q: trading_volume } = parsedData
    //     console.log(symbol, price, trading_volume)
    //     // 處理接收到的數據
    // })

    ws.on('close', function close() {
        console.log('Disconnected from Binance WebSocket')
    })
    // 回應ping保持連接
    ws.on('ping', function ping(data){
        console.log('recieved ping :', data)
        ws.pong(data) 
        console.log('Sent pong:', data)
    })

    return ws
}

const ws = await initializeWebSocket()
export default ws