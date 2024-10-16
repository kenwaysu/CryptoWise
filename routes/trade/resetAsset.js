import express from 'express'
import {resetAsset} from '../../controllers/trade.js'

const router = express.Router()

router.post('/',resetAsset)

export default router