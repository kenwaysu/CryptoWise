import bcrypt from 'bcrypt'
import mysql from 'mysql2/promise'

const pool = mysql.createPool({
    host:'localhost',
    database:'todolist',
    user:'root',
    password:'subo2882'
})

const saltRounds = 10

async function register(req, res) {
    const { username, password } = req.body
    try {
    // 從連接池中獲取連接
        const conn = await pool.getConnection()
            //檢查用戶是否存在
        const checkUserQuery = 'SELECT * FROM users WHERE name = ?'
        const results = await conn.query(checkUserQuery, [username])
        console.log(results[0])
        // 有被註冊過
        if(results[0].length != 0){
            conn.release()
            // console.log(results)
            return res.status(400).send({ error: '用戶已存在' })
        }
        // 沒被註冊過，雜湊加鹽並存入
        const hash = await bcrypt.hash(password, saltRounds)
        console.log('Hashed password:', hash)
        // 存入
        const insertUserQuery = 'INSERT INTO users (name, password) VALUES (?, ?)'
        await conn.query(insertUserQuery, [username, hash])
        conn.release()
        res.status(201).send('註冊成功')
    }catch(err){
        console.log(`register err: ${err}`)
        res.status(500).send('伺服器錯誤')
    }
}

export {register}