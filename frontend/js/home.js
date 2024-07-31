// 整理接收的數據
document.getElementById('MAsearch').addEventListener('click',()=>{
    const tick = document.querySelector('#tick').value
    const ma1 = document.querySelector('#ma1').value
    const compare = document.querySelector('#compare').value
    const ma2 = document.querySelector('#ma2').value
    const data = {
        tick: tick,
        ma1: ma1,
        compare: compare,
        ma2: ma2,
    }
    if(isNaN(Number(ma1)) || isNaN(Number(ma2))){
        alert('MA僅可輸入整數')
    }
    
    axios.post('/search', data)
    .then(response=>{
        console.log(response)
        const tradingPairs = response.data.message
        const table = document.querySelector('.custom-table')
        const row = document.querySelectorAll('.custom-row')
        row.forEach(row => {
            table.removeChild(row)
        })
        tradingPairs.forEach((pair, index) => {
            const row = document.createElement('div');
            row.className = 'custom-row';

            const trackCell = document.createElement('div');
            trackCell.className = 'custom-cell';
            const button = document.createElement('button');
            button.className = 'btn btn-outline-primary';
            button.textContent = '+';
            trackCell.appendChild(button);

            const pairCell = document.createElement('div');
            pairCell.className = 'custom-cell';
            pairCell.textContent = pair;

            const rankCell = document.createElement('div');
            rankCell.className = 'custom-cell';
            rankCell.textContent = index + 1;

            row.appendChild(trackCell);
            row.appendChild(pairCell);
            row.appendChild(rankCell);

            table.appendChild(row)
        })
    
    })
    .catch(error=>{console.log(error)})
})


document.getElementById('login').addEventListener('click',()=>{
    axios.get('/login')
})