import { fileURLToPath } from 'url'
import { dirname } from 'path'
import fs from 'fs'
import jwt from 'jsonwebtoken'
import { nextTick } from 'process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const privateKey = fs.readFileSync('./key/login_key/decrypted_private_key.pem', 'utf8')
const publicKey = fs.readFileSync('./key/login_key/public.key', 'utf8')

async function authenticator(req, res, next){
    const authHeader = req.headers['authorization']
    const token = authHeader.split(' ')[1]
    if (!token) {
       res.status(401).send('登入後即可使用')
       return 
    }
    jwt.verify(token, publicKey, { algorithms: ['RS512'] }, (err, decoded) => {
        if (err) {
           res.status(401).send('登入後即可使用')
           return 
        }
        console.log(decoded)
        req.user = decoded // 將解碼後的用戶資料附加到請求對象上
    })
    next()
}

export {authenticator}