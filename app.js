const express = require('express')
const app = express()

app.get("/", (req, res) => {
    res.send("hello node.js")
})

app.get("/articles", (req, res) => {
    res.send(`article`)
})

app.listen(3000, ()=>{
    console.log("express app listen on port 3000")
})