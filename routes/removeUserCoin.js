import express from 'express'
import {removeUserCoin} from '../controllers/userCoin.js'

const router = express.Router()

router.post('/',removeUserCoin)

export default router