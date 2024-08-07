import express from 'express'
import path from 'path'
import http from 'http'
import https from 'https'
import fs, { read } from 'fs'
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
httpServer.listen(3000, () => {
  console.log('HTTP server listening on port 3000, redirecting to HTTPS');
})

https.createServer(httpsOptions, app).listen(443, ()=>{
    console.log('HTTPS server running on port 443')
})