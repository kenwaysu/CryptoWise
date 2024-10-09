import express from 'express'
import authenticator from '../authenticator.js'
import typePrice from './typePrice.js'
import placeOrder from './placeOrder.js'

const router = express.Router()

router.use('/typePrice',authenticator,typePrice)

router.use('/placeOrder',authenticator,placeOrder)

export default router