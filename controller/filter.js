import fs from 'fs'
import util from 'util'
const readFile = util.promisify(fs.readFile)

async function filter(tick, ma1, compare, ma2){
    const data = await readFile('./data/usdtPairs.json', 'utf-8')
    const usdtPairs = JSON.parse(data); // 存所有USDT交易對
    // 追蹤幣種數量
    let objectTempNum = 0
    const filteredPairs = []
    for (const element of usdtPairs) {
        try {
            const pairSticks = await readFile(`./data/klineSticks/${tick}/${element}.json`, 'utf-8')
            const objectPairSticks = JSON.parse(pairSticks)
            let sum1 = 0
            for (let i = 0; i < ma1; i++) {
                sum1 += parseFloat(objectPairSticks[element][499 - i])
            }
            const avg1 = sum1 / ma1
            let sum2 = 0
            for (let i = 0; i < ma2; i++) {
                sum2 += parseFloat(objectPairSticks[element][499 - i])
            }
            const avg2 = sum2 / ma2

            if (compare === '大於' && avg1 > avg2) {
                objectTempNum++
                // console.log(typeof element)
                filteredPairs[objectTempNum - 1] = element
            } else if (compare === '小於' && avg1 < avg2) {
                objectTempNum++
                // console.log(element,objectTempNum)
                filteredPairs[objectTempNum - 1] = element
            } else if (compare === '等於' && avg1 === avg2) {
                objectTempNum++
                // console.log(element,objectTempNum)
                filteredPairs[objectTempNum - 1] = element
            }
        } catch (err) {
            console.error(`${element}file`, err)
        }
    }
    return filteredPairs
}

export {filter}