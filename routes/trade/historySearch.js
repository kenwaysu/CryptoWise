import express from 'express'
import {historySearch} from '../../controllers/trade.js'

const router = express.Router()

router.post('/',historySearch)

export default router