import { Sequelize, Model, DataTypes } from'sequelize'

const sequelize = new Sequelize('todolist', 'root', 'subo2882', {
  host: 'localhost',
  dialect: 'mysql',
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
});

export default User