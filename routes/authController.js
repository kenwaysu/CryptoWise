import {authController} from '../controllers/authController.js'
import express from 'express'


const router = express.Router()

router.post('/',authController)

export default router