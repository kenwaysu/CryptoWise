import bcrypt from 'bcrypt'
import mysql from 'mysql2/promise'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import { constants } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import User from '../db/mysql.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const privateKey = fs.readFileSync('./key/login_key/decrypted_private_key.pem', 'utf8')
const publicKey = fs.readFileSync('./key/login_key/public.key', 'utf8')

async function login(req, res) {
    const { username, password } = req.body
    
    try {
        //檢查用戶是否存在
        const user = await User.findOne({ where: { name: username } });
        if (!user) {
            return res.status(401).send('用戶名或密碼錯誤');
        }
        // 有註冊，對比密碼hash值是否正確
        console.log(user)
        const correct = await bcrypt.compare(password, user.password)
        if(!correct){
            // 密碼不匹配
            return res.status(401).send('用戶名或密碼錯誤')
        }
        // 密碼匹配
        // 生成 JWT token
        const payload = {
            id: user.id,
            username: 'user.name'
        }
        const token = jwt.sign(payload, privateKey, { 
            algorithm: 'RS512', // 選擇 RSA-SHA512 作為簽名演算法
            expiresIn: '1h'
        })
        console.log('Generated Token:', token)
        // 設置 HTTP-only Cookie
        res.cookie('token', token, {
            httpOnly: true,
            // secure: true, 
            maxAge: 3600000, // 1 小時
        })

        jwt.verify(token, publicKey, { algorithms: ['RS512'] }, (err, decoded) => {
            if (err) {
                return res.status(401).send('Token 驗證失敗')
            } else {
                console.log('驗證通過，解碼後的數據:', decoded)
                res.status(200).send('登入成功')
            }
        })
        
    } catch (err) {
        console.log(`err during login: ${err}`)
        return res.status(500).send(`伺服器錯誤`)
    }
}

export {login}