import {User,CoinList} from '../db/mysql.js'
import {WebSocketServer, WebSocket} from 'ws'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import fs from 'fs'
import jwt from 'jsonwebtoken'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const privateKey = fs.readFileSync('./key/login_key/decrypted_private_key.pem', 'utf8')
const publicKey = fs.readFileSync('./key/login_key/public.key', 'utf8')

async function userCoin(req, res){
    console.log(req.user)
    console.log(req.body.pair)
    try{
    const user = await User.findByPk(req.user.id)
    const coin = await CoinList.findOne({ where: { coin: req.body.pair } })
    if (!coin || coin.price == 0) {
        // 如果找不到對應的幣種，回傳訊息給客戶端
        return res.status(200).json('無效的交易對或不支援的幣種')
    }
    await user.addCoinList(coin)

    const userCoin = await User.findByPk(req.user.id, {
        include: CoinList // 取得該會員所有的自選幣
      })
    const coinListArray = userCoin.CoinLists
    const coinNames = coinListArray.map(coin => coin.coin)
    console.log(coinNames)
    return res.status(200).json(`${req.body.pair}添加成功`)
    }catch(error){
        console.error(error)
    }
}

async function removeUserCoin(req, res){
    console.log(req.user)
    console.log(req.body.coin)
    try {
        const user = await User.findByPk(req.user.id)
        const coin = await CoinList.findOne({ where: { coin: req.body.coin } })
        if (!user) {
            return res.status(404).send('User not found')
        }
        await user.removeCoinList(coin) // 刪除特定的自選幣
        return res.status(200).json(`${req.body.coin} removed successfully!`)
    } catch (error) {
        console.error(error)
        res.status(500).send('DB error occurred while removing the coin')
    }
}
const wss = new WebSocketServer({ noServer: true })

const clients = new Map()

wss.on('connection', async(ws, req) => {
    const userId = req.user.id
    const userName = req.user.username
    clients.set(userId, ws)
    console.log(`新的客戶端${userName}連接`)
    
    setInterval(async () => {
        try {
            const userCoin = await User.findByPk(userId, {
                include: CoinList // 取得該會員所有的自選幣
            })
            // 從資料庫獲取最新的 CoinList 資料
            const coinListArray = userCoin.CoinLists
            const formattedCoins = coinListArray.map(coin => ({
                id: coin.id,
                coin: coin.coin,
                price: coin.price,
                price_change: coin.price_change,
                change_rate: coin.change_rate,
                trading_volume: coin.trading_volume,
                volume_24hr: coin.volume_24hr
            }))
            // 將資料轉換成 JSON 格式並發送給客戶端
            sendToUser(userId,JSON.stringify(formattedCoins))
        } catch (error) {
            console.error('Error querying the database:', error);
            ws.send('Error retrieving coin list');
        }
    }, 1000)

    ws.on('message', (message) => {
      console.log('收到消息:', message)
      
      // 將消息廣播給所有連接的客戶端
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(`服務器收到: ${message}`)
        }
      })
    })
  
    ws.on('close', () => {
        clients.delete(userId)
        console.log(`用戶${userName}已離線`)
    })
  
    ws.send('歡迎連接到 WebSocket 服務器!')
})

function sendToUser(userId, data) {
    const ws = clients.get(userId);
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
}

function webSocketVerify(req, socket, head){
    const cookie = req.headers.cookie
    if (!cookie) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
        socket.destroy()
        return
    }
    const token = cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1]; // 找到以 'token=' 開頭的部分，並提取其值
    try {
        const decoded = jwt.verify(token, publicKey, { algorithms: ['RS512'] })
        req.user = decoded  // 將解碼後的用戶信息附加到請求對象上
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit('connection', ws, req)
        })
    } catch (err) {
        console.error('Token verification failed:', err)
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
        socket.destroy()
    }
}


export {userCoin, webSocketVerify, removeUserCoin}