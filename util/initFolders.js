import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const projectRoot = path.resolve(__dirname, '..') // 定位到 project 資料夾
const dataDir = path.join(projectRoot, 'data')
const usdtPairsFile = path.join(dataDir, 'usdtPairs.json')
const dayVolumnDir = path.join(dataDir, 'dayVolumn')
const klineSticksDir = path.join(dataDir, 'klineSticks')
const intervals = ['5m', '15m', '30m', '1h', '2h', '4h', '1d', '1w']

async function initFolders(){
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir)
    }
    
    if (!fs.existsSync(usdtPairsFile)) {
        fs.writeFileSync(usdtPairsFile,JSON.stringify([]))
    }
    
    if (!fs.existsSync(klineSticksDir)) {
        fs.mkdirSync(klineSticksDir)
    }

    if (!fs.existsSync(dayVolumnDir)) {
        fs.mkdirSync(dayVolumnDir)
    }
    
    intervals.forEach(interval => {
        const intervalDir = path.join(klineSticksDir, interval)
        if (!fs.existsSync(intervalDir)) {
            fs.mkdirSync(intervalDir)
        }
    });
    
    console.log('folders initialized')
}


export default initFolders