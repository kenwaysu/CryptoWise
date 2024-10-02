import express from 'express'
import {userCoin} from '../controllers/userCoin.js'

const router = express.Router()

router.post('/',userCoin)

export default router