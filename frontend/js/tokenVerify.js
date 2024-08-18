document.getElementById('coinList').addEventListener('click',async(event)=>{
    event.preventDefault()
    try {
        const response = await axios.get('/coinList')
        window.location.href = '/coinList'
    } catch (error) {
        console.log(error)
        alert(error.response.data)
    }
})

document.getElementById('trade').addEventListener('click',async(event)=>{
    event.preventDefault()
    try {
        const response = await axios.get('/trade')
        window.location.href = '/trade'
    } catch (error) {
        console.log(error)
        alert(error.response.data)
    }
})