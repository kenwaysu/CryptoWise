// 登入、註冊card顯示交換
document.getElementById('signup-btn').addEventListener('click',(event)=>{
    event.preventDefault()

    document.getElementById('login-card').classList.add('d-none')
    document.getElementById('register-card').classList.remove('d-none')
})

document.getElementById('back-to-login').addEventListener('click',function(event){
    event.preventDefault()

    document.getElementById('register-card').classList.add('d-none')
    document.getElementById('login-card').classList.remove('d-none')
})

// 接收會員註冊
document.getElementById('register').addEventListener('click',async()=>{
    const username = document.getElementById('new-username').value;
    const password = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (password !== confirmPassword) {
        alert('Comfirm passwords do not match!');
        return;
    }
    try {
        const response = await axios.post('/register', {
            username,
            password
        }).then(response=>{
            // 註冊成功
            const registered = response.data
            alert(registered)
        })
    } catch (error) {
        // 註冊失敗
        const errorMessage = error.response.data.error
        alert(errorMessage)
    }
})
