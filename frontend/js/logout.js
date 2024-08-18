// 登出
document.getElementById('logout').addEventListener('click',async()=>{
    try{
        const response = await axios.post('/logout')
        alert(response.data)
        window.location.href = '/memberPage'
    }catch(err){
        console.error('Logout failed:', err)
    }
})