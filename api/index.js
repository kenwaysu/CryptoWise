import axios from 'axios'

const binanceApiCLient = axios.create({
    baseURL: 'https://api.binance.com',
    headers: {
        'Content-Type': 'application/json'
    }
})
async function getKline(params){
    const response = await binanceApiCLient.get('/api/v3/klines',{params})
    return response.data
}

async function getSymbolPrice(){
    const response = await binanceApiCLient.get('/api/v3/ticker/price')
    return response.data
}

export {getKline,getSymbolPrice}