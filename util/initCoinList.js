import { CoinList } from '../db/mysql.js'
import fs from 'fs'
import util from 'util'

const readFile = util.promisify(fs.readFile)

const initDatabase = async () => {
  const data = await readFile('../data/usdtPairs.json', 'utf8')
  const usdtPairs = JSON.parse(data)

  // 將所有幣種存入資料庫
  await Promise.all(
    usdtPairs.map(pair => 
      CoinList.findOrCreate({
        where: { coin: pair.toUpperCase() },
        defaults: { price: 0, price_change: 0 ,change_rate: '0%' ,trading_volume: 0, volume_24hr: 0 }
      })
    )
  )

  console.log('Database initialized with USDT pairs.')
}

initDatabase()