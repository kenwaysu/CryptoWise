import {binanceApiCLient} from './binanceApiClient.js'

async function getSymbolPrice(){
    const response = await binanceApiCLient.get('/api/v3/ticker/price')
    return response.data
}

export {getSymbolPrice}

// const data = await getSymbolPrice()
// console.log(data)