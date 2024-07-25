import express from 'express'
import path from 'path'
import fs from 'fs'
import cron from 'node-cron'
import klineDataFetcher from './controller/klineDataFetcher.js'
import router from './routes/index.js'
import initFolders from './controller/initFolders.js'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
// 設置靜態文件目錄
app.use(express.static(path.join(__dirname, 'frontend')))

// 解析 JSON 請求體
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// 根路由
app.use('/',router)

// 初始化K線存放資料夾
await initFolders()

// 自動排程獲取數據
klineDataFetcher.scheduleTasks()

app.listen(3000, '0.0.0.0', ()=>{
    console.log("express app listen on port 3000")
})
