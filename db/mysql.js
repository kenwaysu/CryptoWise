import { Sequelize, Model, DataTypes } from'sequelize'

const sequelize = new Sequelize('todolist', 'root', '12345678', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,
  pool: {
    max: 150,  // 增加最大連接數
    min: 0,
  }
})

// setInterval(() => {
//   const pool = sequelize.connectionManager.pool
//   console.log(`Pool size: ${pool.size}`)
//   console.log(`Available connections: ${pool.available}`)
// }, 1000)

class User extends Model {}

User.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: { // 對應到資料表中的 'name' 欄位
    type: DataTypes.STRING(225), // 與資料庫中的 VARCHAR(225) 相對應
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING(225), // 與資料庫中的 VARCHAR(225) 相對應
    allowNull: false,
  },
  cash_balance: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  holdings_value: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  asset: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users', // 明確指定資料表名稱
  timestamps: false, // 如果資料表中沒有 createdAt 和 updatedAt 欄位，設置為 false
})

class CoinList extends Model {}

CoinList.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  coin: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  price: {
    type: DataTypes.FLOAT,
    // allowNull: false,
  },
  price_change: {
    type: DataTypes.FLOAT, // 例 '5.2%'
    // allowNull: false,
  },
  change_rate: {
    type: DataTypes.STRING(50), // 例 '5.2%'
    // allowNull: false,
  },
  trading_volume: {
    type: DataTypes.FLOAT,
    // allowNull: false,
  },
  volume_24hr: {
    type: DataTypes.FLOAT,
    // allowNull: false,
  },
}, {
  sequelize, // 用相同sequelize
  modelName: 'CoinList',
  tableName: 'coinlists', 
  timestamps: false,
})
// 建立中介表格userCoin連接User、CoinList的多對多
User.belongsToMany(CoinList, { through: 'userCoin' })
CoinList.belongsToMany(User, { through: 'userCoin' })

class Order extends Model {}
Order.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  order_type: {
    type: DataTypes.ENUM('BUY', 'SELL'),
    allowNull: false,
  },
  order_volume: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  order_price: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  order_value: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
},{
  sequelize, // 用相同sequelize
  modelName: 'Order',
  tableName: 'orders', 
  timestamps: true,
})

class History extends Model {}
History.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  order_type: {
    type: DataTypes.ENUM('BUY', 'SELL'),
    allowNull: false,
  },
  trade_volume: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  trade_price: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  trade_value: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
},{
  sequelize, // 用相同sequelize
  modelName: 'History',
  tableName: 'history', 
  timestamps: true,
})

class Portfolio extends Model {}
Portfolio.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  total_volume: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  average_cost: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  total_cost: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  current_value: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  profit_loss: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
},{
  sequelize, // 用相同sequelize
  modelName: 'Portfolio',
  tableName: 'portfolio', 
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['UserId', 'CoinListId'] // 設定 UserId 和 CoinListId 為聯合唯一性
    }
  ]
})

// User 和 Order 一對多
User.hasMany(Order)
Order.belongsTo(User)

// CoinList 和 Order 多對一
CoinList.hasMany(Order)
Order.belongsTo(CoinList)

// User 和 History 一對多
User.hasMany(History)
History.belongsTo(User)

// CoinList 和 History 多對一
CoinList.hasMany(History)
History.belongsTo(CoinList)

// User 和 Portfolio 一對多
User.hasMany(Portfolio)
Portfolio.belongsTo(User)

// CoinList 和 Portfolio 多對一
CoinList.hasMany(Portfolio)
Portfolio.belongsTo(CoinList)

async function sequelizeSync(){
  await sequelize.sync({ alter: true })
  console.log('All models were synchronized successfully.')
}

// sequelizeSync()

export { User, CoinList, Order, History, Portfolio}