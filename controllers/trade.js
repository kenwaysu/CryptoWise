import { Sequelize, Op } from 'sequelize'
import {User, CoinList, Order, History, Portfolio} from '../db/mysql.js'


async function typePrice(req, res){
    const pair = req.body.coin
    const coin = await CoinList.findOne({ where: { coin: pair } })
    if(!coin){
        return res.status(200).send('無效的交易對或不支援的幣種')
    }
    const price = coin.price
    res.json({price})
}

async function placeOrder(req, res){
    const { cryptoSelect, order_type, order_volume, order_price, order_value } = req.body.order
    console.log(req.user.id, cryptoSelect, order_type, order_volume, order_price, order_value)
    try {
        const user = await User.findByPk(req.user.id)
        const coin = await CoinList.findOne({ where: { coin: cryptoSelect } })
        if (!coin || coin.price == 0) {
            // 如果找不到對應的幣種，回傳訊息給客戶端
            return res.status(200).json('無效的交易對或不支援的幣種')
        }
        const portfolio = await Portfolio.findOne({
            where: {
              UserId: req.user.id,
              CoinListId: coin.id
            }
          })
        const totalPendingVolume = await Order.sum('order_volume', {
            where: {
                UserId: req.user.id,  // 使用者ID
                CoinListId: coin.id,  // 幣種ID
                order_type: 'SELL'    // 訂單類型為 'SELL'
            }
        })
        const totalPendingValue = await Order.sum('order_value', {
            where: {
                UserId: req.user.id,  // 使用者ID
                order_type: 'BUY'    // 訂單類型為 'SELL'
            }
        })
        if(order_type === 'SELL' && !portfolio){
            return res.status(200).json('剩餘幣不足')
        }
        if(order_type === 'SELL' && order_volume > portfolio.total_volume - totalPendingVolume){
            return res.status(200).json('剩餘幣不足')
        }
        if(order_type === 'BUY' && order_value > user.cash_balance - totalPendingValue){
            return res.status(200).json('剩餘現金不足')
        }
        // console.log(order_Type)
        await Order.create({
            order_type,
            order_volume,
            order_price,
            order_value,
            UserId:user.id,
            CoinListId:coin.id,
        })

        return res.status(201).json({ message: '訂單已成功建立' })
    } catch (error) {
        console.error(error)
        return res.status(500).json('訂單創建失敗')
    }
}

async function removeOrder(req, res){
    console.log(req.user)
    console.log(req.body.id)
    try {
        const order = await Order.findByPk(req.body.id)
        if (order) {
            await order.destroy()            
            return res.status(200).json(`Order removed successfully!`)
        } else {
            return res.status(200).json(`Order has been filled!`)
        }
    } catch (error) {
        console.error(error)
        res.status(500).send('DB error occurred while removing the coin')
    }
}

async function resetAsset(req, res){
    const userId = req.user.id 

    try {
        await Order.destroy({
            where: { UserId: userId }
        })

        await History.destroy({
            where: { UserId: userId }
        })

        await Portfolio.destroy({
            where: { userId: userId }
        })

        await User.update(
            { holdings_value: 0, cash_balance: 10000 },
            { where: { id: userId } }
        )

        return res.status(201).json({ message: '資金已重置' })

    } catch (error) {
        console.error('Error resetting user assets:', error)
        return res.status(500).json({ error: '資金重置失敗，請稍後再試' })
    }
}

async function historySearch(req, res){
    const { startDate, endDate } = req.body
    const userId = req.user.id
    try {
        const histories = await History.findAll({
            where: {
                UserId: userId,  // 僅查詢該用戶的紀錄
                updatedAt: {
                    [Op.between]: [startDate, endDate] // 過濾日期範圍
                }
            },
            include: [{
                model: CoinList,
                attributes: ['coin']
            }],
            order: [['updatedAt', 'DESC']]  // 降序排列（最新的紀錄在最上面）
        });

        const formattedHistories = histories.map(history => ({
            id: history.id,
            coin: history.CoinList.coin,
            order_type: history.order_type,
            trade_volume: history.trade_volume,
            trade_price: history.trade_price,
            trade_value: history.trade_value,
            timestamp: history.createdAt
        }))
        res.status(201).json(formattedHistories)
    } catch (error) {
        console.error('Error fetching history data:', error)
        res.status(500).json({ message: '無法查詢歷史紀錄' })
    }
}


export {typePrice, placeOrder, removeOrder, resetAsset, historySearch}