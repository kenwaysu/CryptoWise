 function logout(req, res) {
    // 删除 token Cookie
    try{
    res.clearCookie('token',{
        httpOnly: true,
        // secure: true,
        sameSite: 'Strict'
    })
    res.status(200).send('登出成功，回到登入頁面')
    }catch(err){
        console.error(err)
    }
}   

export {logout}