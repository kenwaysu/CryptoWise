import search from './search.js'
import register from './register.js'
import authController from './authController.js'
import express from 'express'
import tokenVerify from './tokenVerify.js'

const router = express.Router()

router.use('/search', search)

router.use('/register',register)

router.use('/authController', authController)

router.use('/token-verify',tokenVerify)

export default router