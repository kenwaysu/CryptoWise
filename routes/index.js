import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

import search from './search.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const router = express.Router()

router.get('/',(req,res)=>{
    const homePath = path.join(__dirname,'../public/html/home.html')
    res.sendFile(homePath,(err)=>{
        // console.log(err)
    })
})

router.use('/search', search)

export default router