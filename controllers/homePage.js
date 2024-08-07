import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { dirname } from 'path'
import jwt from 'jsonwebtoken'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const publicKey = fs.readFileSync('./key/login_key/public.key', 'utf8')

async function homePage(req,res){
    const homePath = path.join(__dirname,'../frontend/html/home.html')
    res.sendFile(homePath,(err)=>{
        // console.log(err)
    })
}

async function memberPage(req,res){
    const token = req.cookies.token || req.headers['authorization']
    const loginPath = path.join(__dirname,'../frontend/html/login.html')
    const logoutPath = path.join(__dirname,'../frontend/html/logout.html')
    jwt.verify(token, publicKey, { algorithms: ['RS512'] }, (err) => {
        if (err) {
            return res.sendFile(loginPath)
        } else {
            return res.sendFile(logoutPath)
        }
    })
    
}

export default {homePage, memberPage}