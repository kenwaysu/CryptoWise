import {User, CoinList, Order, History, Portfolio} from '../db/mysql.js'
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
            include: [
                {
                    model: CoinList,  // 包含自選幣
                    through: { attributes: [] } // 如果不想要中介表的欄位
                }]
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

const clients = new Map();

wss.on('connection', async (ws, req) => {
    const userId = req.user.id
    const userName = req.user.username
    clients.set(userId, { ws, interval: null }) // 存儲 websocket 和定時器
    console.log(`新的客戶端${userName}連接`)

    ws.on('message', async (message) => {
        const parsedMessage = JSON.parse(message)
        if (parsedMessage.action === 'subscribeUserCoins') {
            // 如果已有定時器，則清除舊的
            if (clients.get(userId).interval) {
                clearInterval(clients.get(userId).interval)
            }

            // 設定新的定時器
            const interval = setInterval(async () => {
                try {
                    const userCoin = await User.findByPk(userId, {
                        include: [
                            {
                                model: CoinList,  // 包含自選幣
                                through: { attributes: [] } // 如果不想要中介表的欄位
                            }]
                    });

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
                    }));

                    // 將資料轉換成 JSON 格式並發送給客戶端
                    sendToUser(userId, formattedCoins);
                } catch (error) {
                    console.error('Error querying the database:', error)
                    ws.send('Error retrieving coin list')
                }
            }, 1000)

            // 更新 clients 中的定時器
            clients.get(userId).interval = interval
        }
        // 交易推送
        if (parsedMessage.action === 'subscribeTradeUpdates') {
            // 歷史數據推送
            sendHistoryToUser(userId)
            // 用hook監聽新創立的歷史紀錄並推送
            History.afterCreate(async (history, options) => {
                try {
                    const userId = history.UserId
            
                    // 推送歷史紀錄給該使用者
                    await sendHistoryToUser(userId)
                } catch (error) {
                    console.error('Error sending history updates:', error)
                }
            })
            // 用hook監聽新刪除的order並推送
            Order.afterDestroy(async (order, options) => {
                try {
                    // 獲取被刪除的訂單相關信息
                    const userId = order.UserId
                    const orderId = order.id
            
                    // 假設你有一個 `sendOrderRemovalToUser` 函數來推送刪除的訊息
                    await sendOrderRemovalToUser(userId, orderId)
                } catch (error) {
                    console.error('Error sending order removal updates:', error)
                }
            })

            Portfolio.afterDestroy(async (Portfolio, options) => {
                try {
                    // 獲取被刪除的訂單相關信息
                    const userId = Portfolio.UserId
                    const portfolioId = Portfolio.id
                    // 假設你有一個 `sendPortfolioRemovalToUser` 函數來推送刪除的訊息
                    await sendPortfolioRemovalToUser(userId, portfolioId)
                } catch (error) {
                    console.error('Error sending Portfolio removal updates:', error)
                }
            })

            // Order、portfolio、現金、持有部位用Interval持續推送
            if (clients.get(userId).interval) {
                clearInterval(clients.get(userId).interval)
            }
            const interval = setInterval(async () => {
                sendOrderToUser(userId)
                sendPortfolioToUser(userId)
                sendAssetToUser(userId)
                sendTopPlayerToUser(userId)
            }, 1000)

            clients.get(userId).interval = interval
        }
    })
    ws.on('close', () => {
        // 清除用戶的定時器
        clearInterval(clients.get(userId)?.interval)
        clients.delete(userId);
        console.log(`用戶${userName}已離線`)
    })

    ws.send('歡迎連接到 WebSocket 服務器!')
})

function sendToUser(userId, formattedCoins) {
    const client = clients.get(userId)
    const ws = client?.ws
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: 'coinUpdates', data: formattedCoins }))
    }
}

async function sendOrderToUser(userId){
    const client = clients.get(userId)
    const ws = client?.ws
    try {
        const userOrders = await Order.findAll({
            where: {
              UserId: userId
            },
            include: [{
                model: CoinList,
                attributes: ['coin']
            }]
        })
       
        const formattedOrders = userOrders.map(order => ({
            id: order.id,
            coin: order.CoinList.coin,
            order_type: order.order_type,
            order_volume: order.order_volume,
            order_price: order.order_price,
            order_value: order.order_value,
        }))
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action: 'orderUpdates', data: formattedOrders }))
        }
    } catch (error) {
        console.error('Error querying the database:', error)
    }
}

async function sendOrderRemovalToUser(userId, orderId){
    const client = clients.get(userId)
    const ws = client?.ws

    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: 'orderRemoved', data: [orderId] }))
    }
}

async function sendHistoryToUser(userId) {
    const client = clients.get(userId);
    const ws = client?.ws;

    try {
        const userHistory = await History.findAll({
            where: {
                UserId: userId
            },
            include: [{
                model: CoinList,
                attributes: ['coin']
            }],
            limit: 15,  // 限制最多返回15筆
            order: [['createdAt', 'DESC']]  // 按創建時間降序排列
        })

        // 格式化歷史紀錄
        const formattedHistory = userHistory.map(history => ({
            id: history.id,
            coin: history.CoinList.coin,
            order_type: history.order_type,
            trade_volume: history.trade_volume,
            trade_price: history.trade_price,
            trade_value: history.trade_value,
            timestamp: history.createdAt
        }))

        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action: 'historyUpdates', data: formattedHistory }));
        }
    } catch (error) {
        console.error('Error querying the history table:', error)
    }
}

async function sendPortfolioToUser(userId){
    const client = clients.get(userId)
    const ws = client?.ws
    try {
        const userPortfolios = await Portfolio.findAll({
            where: {
                UserId: userId
            },
            include: [{
                model: CoinList,  
                attributes: ['coin']
            }]
        })

        const formattedPortfolios = userPortfolios.map(portfolio => ({
            id: portfolio.id,
            coin: portfolio.CoinList.coin,
            total_volume: portfolio.total_volume,
            average_cost: portfolio.average_cost,
            total_cost: portfolio.total_cost,
            current_value: portfolio.current_value,
            profit_loss: portfolio.profit_loss
        }))

        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action: 'portfolioUpdates', data: formattedPortfolios }))
        }
    } catch (error) {
        console.error('Error querying the portfolio:', error)
    }
}

async function sendPortfolioRemovalToUser(userId, portfolioId){
    const client = clients.get(userId)
    const ws = client?.ws

    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: 'portfolioRemoved', data: [portfolioId] }))
    }
}

async function sendAssetToUser(userId){
    const client = clients.get(userId)
    const ws = client?.ws
    try {
        const user = await User.findByPk(userId, {
            attributes: ['cash_balance', 'holdings_value']
        })

        if (!user) {
            console.error(`User with id ${userId} not found.`)
            return
        }

        const userAssets = {
            cash_balance: user.cash_balance,
            holdings_value: user.holdings_value
        }

        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action: 'assetUpdates', data: userAssets }))
        }
    } catch (error) {
        console.error('Error querying the database for user assets:', error)
    }
}

async function sendTopPlayerToUser(userId) {
    const client = clients.get(userId)
    const ws = client?.ws

    try {
        // 查詢資產前10名的使用者
        const topPlayers = await User.findAll({
            order: [['asset', 'DESC']],  // 根據 asset 欄位進行遞減排序
            limit: 10,                   // 限制結果數量為10個
            attributes: ['id', 'name', 'asset']  
        })

        // 格式化資料
        const formattedPlayers = topPlayers.map(player => ({
            id: player.id,
            name: player.name, 
            asset: player.asset
        }))

        // 確保 WebSocket 是開啟的
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action: 'topPlayerUpdates', data: formattedPlayers }))
        }
    } catch (error) {
        console.error('Error querying the database for top players:', error)
    }
}

function webSocketVerify(req, socket, head) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    if (!token) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
    }


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
// function webSocketVerify(req, socket, head){
//     const cookie = req.headers.cookie
//     if (!cookie) {
//         socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
//         socket.destroy()
//         return
//     }
//     const token = cookie
//         .split('; ')
//         .find(row => row.startsWith('token='))
//         ?.split('=')[1]; // 找到以 'token=' 開頭的部分，並提取其值
//     try {
//         const decoded = jwt.verify(token, publicKey, { algorithms: ['RS512'] })
//         req.user = decoded  // 將解碼後的用戶信息附加到請求對象上
//         wss.handleUpgrade(req, socket, head, (ws) => {
//           wss.emit('connection', ws, req)
//         })
//     } catch (err) {
//         console.error('Token verification failed:', err)
//         socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
//         socket.destroy()
//     }
// }


export {userCoin, webSocketVerify, removeUserCoin}