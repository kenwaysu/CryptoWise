import axios from 'axios'

const binanceApiCLient = axios.create({
    baseURL: 'https://api.binance.com',
    headers: {
        'Content-Type': 'application/json'
    }
})

export {binanceApiCLient}