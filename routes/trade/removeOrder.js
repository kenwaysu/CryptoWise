import express from 'express'
import {removeOrder} from '../../controllers/trade.js'

const router = express.Router()

router.post('/',removeOrder)

export default router