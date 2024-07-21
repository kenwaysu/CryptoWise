import express from 'express'
import axios from 'axios'
import path from 'path'
import fs from 'fs'
import cron from 'node-cron'
import util from 'util'//賦予轉換返回Promise 的函数
import pLimit from 'p-limit'//限制同時併發請求的數量
import klineDataFetcher from './controller/klineDataFetcher.js'
import { fileURLToPath } from 'url'
import { filter } from './controller/filter.js'
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
    const filteredPairs = await filter(tick, ma1, compare, ma2)
    res.json({message: filteredPairs})
    
    // console.log(filteredPairs, filteredPairs.length)
})

// klineDataFetcher.scheduleTasks()

app.listen(3000, '0.0.0.0', ()=>{
    console.log("express app listen on port 3000")
})

