import bcrypt from 'bcrypt'
import mysql from 'mysql2'

const pool = mysql.createPool({
    host:'localhost',
    database:'todolist',
    user:'root',
    password:'subo2882'
})

const saltRounds = 10

function register(req, res) {
    const { username, password } = req.body
  
    // 從連接池中獲取連接
    pool.getConnection((err, conn) => {
        if (err) {
            console.error('Error getting connection from pool:', err)
            return res.status(500).send('mysql server error')
        }
        //檢查用戶是否存在
        const checkUserQuery = 'SELECT * FROM users WHERE name = ?'
        conn.query(checkUserQuery, [username], (err, results)=>{
            if (err) {
                console.error('Error checking username:', err)
                conn.release()
                return res.status(500).send('query error')
            }
            // 有被註冊過
            if(results[0]){
                conn.release()
                return res.status(400).send({ error: 'Username is existed.' })
            }
            // 沒被註冊過，雜湊加鹽並存入
            bcrypt.hash(password, saltRounds, (err, hash)=>{
                if (err) {
                    console.error('Error hashing password:', err)
                    conn.release()
                    return res.status(500).send('hashing error')
                }
                console.log('Hashed password:', hash)
                // 存入
                const insertUserQuery = 'INSERT INTO users (name, password) VALUES (?, ?)'
                conn.query(insertUserQuery, [username, hash], (err, results)=>{
                    conn.release()
                    if (err) {
                        console.error('Error inserting user:', err)
                        return res.status(500).send('Server error')
                    }
                    res.status(201).send('User registered successfully')
                })
            })
        })
    })
}

export {register}