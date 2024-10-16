import express from 'express'
import authenticator from '../authenticator.js'
import typePrice from './typePrice.js'
import placeOrder from './placeOrder.js'
import removeOrder from './removeOrder.js'
import resetAsset from './resetAsset.js'
import historySearch from './historySearch.js'

const router = express.Router()

router.use('/typePrice',authenticator,typePrice)

router.use('/placeOrder',authenticator,placeOrder)

router.use('/removeOrder',authenticator,removeOrder)

router.use('/resetAsset',authenticator,resetAsset)

router.use('/historySearch',authenticator,historySearch)


export default router