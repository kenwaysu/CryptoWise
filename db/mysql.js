import { Sequelize, Model, DataTypes } from'sequelize'

const sequelize = new Sequelize('todolist', 'root', '12345678', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,
  pool: {
    max: 20,  // 增加最大連接數
    min: 0,
  }
})

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


async function sequelizeSync(){
  await sequelize.sync({ alter: true })
  console.log('All models were synchronized successfully.')
}

// sequelizeSync()

export { User, CoinList }