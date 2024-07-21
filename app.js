import express from 'express'
import axios from 'axios'
import path from 'path'
import fs from 'fs'
import cron from 'node-cron'
import util from 'util'//賦予轉換返回Promise 的函数
import pLimit from 'p-limit'//限制同時併發請求的數量
import klineDataFetcher from './controler/klineDataFetcher.js'
import { fileURLToPath } from 'url';
const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
// 設置靜態文件目錄
app.use(express.static(path.join(__dirname, 'public')))

// 解析 JSON 請求體
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'public','html','home.html'))
})

app.post("/search", async (req, res) => {
    // 獲取前端post請求內容用req.body
    const { tick, ma1, compare, ma2 } = req.body
    console.log(tick, ma1, compare, ma2)
    const data = await readFile('./data/usdtPairs.json', 'utf-8')
    const usdtPairs = JSON.parse(data); // 存所有USDT交易對
    // 追蹤幣種數量
    let objectTempNum = 0
    const filteredPairs = []
    for (const element of usdtPairs) {
        try {
            const pairSticks = await readFile(`./data/klineSticks/${tick}/${element}.json`, 'utf-8')
            const objectPairSticks = JSON.parse(pairSticks)
            let sum1 = 0
            for (let i = 0; i < ma1; i++) {
                sum1 += parseFloat(objectPairSticks[element][499 - i])
            }
            const avg1 = sum1 / ma1
            let sum2 = 0
            for (let i = 0; i < ma2; i++) {
                sum2 += parseFloat(objectPairSticks[element][499 - i])
            }
            const avg2 = sum2 / ma2

            if (compare === '大於' && avg1 > avg2) {
                objectTempNum++
                // console.log(typeof element)
                filteredPairs[objectTempNum - 1] = element
            } else if (compare === '小於' && avg1 < avg2) {
                objectTempNum++
                // console.log(element,objectTempNum)
                filteredPairs[objectTempNum - 1] = element
            } else if (compare === '等於' && avg1 === avg2) {
                objectTempNum++
                // console.log(element,objectTempNum)
                filteredPairs[objectTempNum - 1] = element
            }
        } catch (err) {
            console.error(`${element}file`, err)
        }
    }
    res.json({message: filteredPairs})
    
    // console.log(filteredPairs, filteredPairs.length)
})

klineDataFetcher.scheduleTasks()


app.listen(3000, '0.0.0.0', ()=>{
    console.log("express app listen on port 3000")
})

