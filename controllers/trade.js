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


export {typePrice, placeOrder}