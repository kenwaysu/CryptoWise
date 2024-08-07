import search from './search.js'
import register from './register.js'
import login from './login.js'
import logout from './logout.js'
import {tokenVerify} from '../controllers/tokenVerify.js'
import homePage from '../controllers/homePage.js'
import express from 'express'

const router = express.Router()

router.get('/', homePage.homePage)

router.get('/memberPage', homePage.memberPage)

router.get('/coinList',tokenVerify, homePage.listPage)

router.get('/trade',tokenVerify, homePage.tradePage)

router.use('/search', search)

router.use('/register',register)

router.use('/login', login)

router.use('/logout', logout)

export default router