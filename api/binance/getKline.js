import {binanceApiCLient} from './binanceApiClient.js'

async function getKline(params){
    const response = await binanceApiCLient.get('/api/v3/klines',{params})
    return response.data
}

export {getKline}

// const a = {
//     symbol:"BTCUSDT",
//     interval:"5m"
// }
// const data = await getKline(a)
// console.log(data)