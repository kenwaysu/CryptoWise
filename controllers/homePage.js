import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function homePage(req,res){
    const homePath = path.join(__dirname,'../frontend/html/home.html')
    res.sendFile(homePath,(err)=>{
        // console.log(err)
    })
}

async function loginPage(req,res){
    const loginPath = path.join(__dirname,'../frontend/html/login.html')
    res.sendFile(loginPath,(err)=>{
        // console.log(err)
    })
}

export default {homePage, loginPage}