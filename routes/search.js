import express from 'express'
import { filter } from '../controller/filter.js'

const router = express.Router()

router.post('/', filter)

export default router