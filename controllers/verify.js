async function verify(req, res, next){
    const token = req.cookies.token || req.headers['authorization']
    if (!token) {
        return res.status(401).send('未提供 token')
    }
    jwt.verify(token, privateKey, (err, decoded) => {
        if (err) {
            return res.status(401).send('無效的 token')
        }
        req.user = decoded // 將解碼後的用戶資料附加到請求對象上
        next()
    })
}