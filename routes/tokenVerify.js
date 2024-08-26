import {tokenVerify} from '../controllers/tokenVerify.js'
import express from 'express'


const router = express.Router()

router.post('/',tokenVerify)

export default router