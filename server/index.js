const express = require('express');

const app = express();
const port = 8000;

app.get('/route1', (req, res) => {
    res.send('Hello Preethi!')
})


app.get('/route2', (req, res) => {
    res.send('Hello Chotu')
})

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
})