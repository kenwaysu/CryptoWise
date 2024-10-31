import bcrypt from 'bcryptjs'
import mysql from 'mysql2/promise'
import {User} from '../db/mysql.js'

const saltRounds = 10

async function register(req, res) {
    const { username, password } = req.body
    try {
        // 檢查用戶是否存在
        const existingUser = await User.findOne({ where: { name: username } })
        console.log(existingUser)
        // 有被註冊過
        if (existingUser) {
            return res.status(401).send({ error: '用戶已存在' });
        }

        // 沒被註冊過，雜湊加鹽並存入
        const hash = await bcrypt.hash(password, saltRounds)
        console.log('Hashed password:', hash)
        // 存入新用戶
        await User.create({ name: username, password: hash, cash_balance: 10000, holdings_value: 0, asset: 10000})
        res.status(200).send('註冊成功')
    }catch(err){
        console.log(`register err: ${err}`)
        res.status(500).send('伺服器錯誤')
    }
}

export {register}