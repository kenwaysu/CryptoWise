import express from 'express'
import axios from 'axios'
import path from 'path'
import fs from 'fs'
import cron from 'node-cron'
import util from 'util'//賦予轉換返回Promise 的函数
import pLimit from 'p-limit'//限制同時併發請求的數量
//將readFile、writeFile 轉換為promise
const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)

const limit = pLimit(30)

async function getBinanceUsdtPairs(){
    try{
        let binancePairs = await axios('https://api.binance.com/api/v3/ticker/price')
        let pairs = await binancePairs.data.map(item => item.symbol)
        let usdtPairs = await pairs.filter(item => item.includes('USDT'))
        console.log(usdtPairs)

        fs.writeFile('./data/usdtPairs.json', JSON.stringify(usdtPairs, null, 4), (err) => {
            if (err) {
                console.error('Error writing to file:', err);
            } else {
                console.log('usdtPairs saved to usdtPairs.json');
            }
        });

    }catch (error){
        console.error('Error fetching data:', error)
    }
}

async function getKlineStick(time) {
    try {
        const data = await readFile("./data/usdtPairs.json", "utf8")
        const usdtPairsArray = JSON.parse(data)
        // const { default: pLimit } = await import('p-limit')
        // const limit = pLimit(30)
        const requests = await usdtPairsArray.map(usdtPair => limit( async () => {
            try {
                const klineStickSymbol = {}
                const klineRawData = await axios({url: `https://api.binance.com/api/v3/klines?symbol=${usdtPair}&interval=${time}`,
                // timeout: 900000000
                })
                const klineClosePrice = klineRawData.data.map(innerArray => innerArray[5])
                klineStickSymbol[usdtPair] = klineClosePrice

                await writeFile(`./data/klineSticks/1h/${usdtPair}.json`, JSON.stringify(klineStickSymbol, null, 4))
                console.log(`${usdtPair} pair saved to ${usdtPair}Stick.json`)
                console.log(klineStickSymbol)
            } catch (error) {
                console.error(`Error fetching or writing data for ${usdtPair}:`, error)
            }
        }))

        await Promise.all(requests)
    } catch (error) {
        console.error('Error reading file or processing data:', error)
    }
}

cron.schedule('0.5 0 20 * * *', () => {
    console.log('fetch Binance USDT pairs every day at 8:00 PM')
    getBinanceUsdtPairs()
})

const schedules = [
    { time: '5m',  cronTime: '2 */5 * * * *' },
    { time: '15m', cronTime: '2 */15 * * * *'},
    { time: '30m', cronTime: '2 */30 * * * *'},
    { time: '1h',  cronTime: '2 1 * * * *'},
    { time: '2h',  cronTime: '2 1 */2 * * *'},
    { time: '4h',  cronTime: '2 1 */4 * * *' },
    { time: '1d',  cronTime: '0 2 0 * * *' },
    { time: '1w',  cronTime: '0 2 0 * * 0' },
]

schedules.forEach( schedule => {
    cron.schedule(schedule.cronTime, ()=> {
        console.log(`Fetching ${schedule.time} data`)
        getKlineStick(schedule.time)
    })
})




// app.get("/", (req, res) => {
//     res.send("hello node.js")
// })

// app.get("/articles", (req, res) => {
//     res.send(`article`)
// })

// app.listen(3000, ()=>{
//     console.log("express app listen on port 3000")
// })