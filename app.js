const express = require('express')
const app = express()
const axios = require('axios')
const path = require('path')
const fs = require('fs')
const cron = require('node-cron');

const usdtPairsJsonPath = path.join(__dirname, "./data/usdtPairs.json")
// 注意每分鐘權重6000內
async function getBinanceUsdtPairs(){
    try{
        let binancePairs = await axios('https://api.binance.com/api/v3/ticker/price')
        let pairs = await binancePairs.data.map(item => item.symbol)
        let usdtPairs = await pairs.filter(item => item.includes('USDT'))
        console.log(usdtPairs)

        fs.writeFile(usdtPairsJsonPath, JSON.stringify(usdtPairs, null, 4), (err) => {
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

async function getKlinestick(){
    try{
        fs.readFile("./data/usdtPairs.json", "utf8", async (err,data)=>{
            if(err){
                console.log(err)
            }else{
                // console.log(JSON.parse(data).length)
                for(let i = 0; i < JSON.parse(data).length; i++){
                    usdtPairs = JSON.parse(data)[i]
                    try{
                        // 讀取交易對
                        klineStickSymbol = {}
                        const klineRawData = await axios(`https://api.binance.com/api/v3/klines?symbol=${usdtPairs}&interval=1h`)
                        const klineClosePrice = await klineRawData.data.map(innerArray => innerArray[5])
                        klineStickSymbol[usdtPairs] = klineClosePrice
                        fs.writeFile(`./data/klineSticks/1h/${usdtPairs}.json`, JSON.stringify(klineStickSymbol, null, 4),(err)=>{
                            if(err){
                                console.log('Error writing to file:', err);
                            } else {
                                console.log(`${usdtPairs}pair saved to ${usdtPairs}Stick.json`);
                            }
                        })
                        console.log(klineStickSymbol)
                    }catch(error){
                        console.log(error)
                    }
                }
            }
        })
        
    }
    catch(error){
        console.log(error)
    }
}
getKlinestick()


cron.schedule('0 0 20 * * *', () => {
    console.log('fetch Binance USDT pairs every day at 8:00 PM')
    getBinanceUsdtPairs()
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