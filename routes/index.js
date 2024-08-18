import search from './search.js'
import register from './register.js'
import authController from './authController.js'
import express from 'express'

const router = express.Router()

router.use('/search', search)

router.use('/register',register)

router.use('/authController', authController)

export default router