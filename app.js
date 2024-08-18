import express from 'express'
import path from 'path'
import http from 'http'
import https from 'https'
import fs, { read } from 'fs'
import cors from 'cors'
import cron from 'node-cron'
import klineDataFetcher from './controllers/klineDataFetcher.js'
import router from './routes/index.js'
import initFolders from './util/initFolders.js'
import { fileURLToPath } from 'url'
import cookieParser from 'cookie-parser'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// HTTPS 設置
const httpsOptions = {
    key: fs.readFileSync('./key/SSL_key/privatekey.pem'),
    cert: fs.readFileSync('./key/SSL_key/certificate.pem')
}

// app.all('*', (req, res, next) => {
//     if(req.protocol === 'http'){
//         res.redirect(`https://111.185.165.8${req.url}`)
//     }else{
//         next()
//     }
// })
// https://111.185.165.8

app.use(cors({
  origin: 'https://127.0.0.1', // 設置允許的前端地址，部屬時要再改成IP
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // 允許HTTP請求種類
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // 如果需要傳遞 cookie 或者授權標頭，設置為 true
}))

app.options('https://127.0.0.1', cors())

// 設置靜態文件目錄
app.use(express.static(path.join(__dirname, 'frontend')))

// 解析 JSON 請求體
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

// 根路由
app.use('/',router)

// 初始化K線存放資料夾
await initFolders()

// 自動排程獲取數據
// klineDataFetcher.scheduleTasks()

const httpServer = http.createServer(app);
httpServer.listen(3001, () => {
  console.log('HTTP server listening on port 3001, redirecting to HTTPS')
})

https.createServer(httpsOptions, app).listen(444, ()=>{
    console.log('HTTPS server running on port 444')
})

// app.listen(3001,()=>{
//   console.log('HTTP server listening on port 3001')
// })