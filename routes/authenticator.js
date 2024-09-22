import {authenticator} from '../controllers/authenticator.js'
import express from 'express'


const router = express.Router()

router.post('/',authenticator)

export default router