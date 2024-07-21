import express from 'express'
import { filter } from '../controller/filter.js'

const router = express.Router()

router.post('/', async (req, res) => {
    // 獲取前端post請求內容用req.body
    try{
        const { tick, ma1, compare, ma2 } = req.body
        console.log(tick, ma1, compare, ma2)
        const filteredPairs = await filter(tick, ma1, compare, ma2)
        res.json({message: filteredPairs})
    }catch(err){
        console.log(`err on backend /search ${err}`)
    }
    // console.log(filteredPairs, filteredPairs.length)
})

export default router