import search from './search.js'
import register from './register.js'
import authController from './authController.js'
import express from 'express'
import tokenVerify from './tokenVerify.js'
import userCoin from './userCoin.js'
import removeUserCoin from './removeUserCoin.js'
import authenticator from './authenticator.js'
import trade from './trade/index.js'


const router = express.Router()

router.use('/api/search', search)

router.use('/api/register', register)

router.use('/api/authController', authController)

router.use('/api/token-verify', tokenVerify)

router.use('/api/userCoin', authenticator, userCoin)

router.use('/api/removeUserCoin', authenticator, removeUserCoin)

router.use('/api/trade', trade)

export default router