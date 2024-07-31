import search from './search.js'
import register from './register.js'
import homePage from '../controllers/homePage.js'
import express from 'express'

const router = express.Router()

router.get('/', homePage.homePage)

router.get('/login', homePage.loginPage)

router.use('/search', search)

router.use('/register',register)

export default router