import express from 'express'
import {typePrice} from '../../controllers/trade.js'

const router = express.Router()

router.post('/',typePrice)

export default router