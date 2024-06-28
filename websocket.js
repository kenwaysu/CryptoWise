import WebSocket from 'ws'
import fs from 'fs'
import util from 'util'



const readFile = util.promisify(fs.readFile)
const data = await readFile('./data/usdtPairs.json', "utf8")
const usdtPairs = JSON.parse(data)
const usdtPairsPart1 = usdtPairs.slice(0, 300)
const subscribePairs1 = usdtPairsPart1.map(pair => `${pair.toLowerCase()}@trade`)
console.log(subscribePairs1)

const usdtPairsPart2 = usdtPairs.slice(300, 529)
const subscribePairs2 = usdtPairsPart2.map(pair => `${pair.toLowerCase()}@trade`)
console.log(subscribePairs2)

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

ws.on('message', function incoming(data) {
    console.log(`Received message: ${data}`)
    // 處理接收到的數據
})

ws.on('close', function close() {
    console.log('Disconnected from Binance WebSocket')
})

ws.on('ping', function ping(data){
    console.log('recieved ping :', data)
})
