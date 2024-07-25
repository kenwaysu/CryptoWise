import search from './search.js'
import { homePage } from '../controller/homePage.js'
import express from 'express'

const router = express.Router()

router.get('/', homePage)

router.use('/search', search)

export default router