import express from 'express'
import { filter } from '../controllers/filter.js'

const router = express.Router()

router.post('/', filter)

export default router