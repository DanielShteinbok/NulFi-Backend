const express = require('express')
const app = express()
const port = 3000

app.use(express.json())

app.get('/', (req, res) => {
  console.log("got a request");
  res.send('Hello World!')
})

app.post('/', (req, res) => {
  console.log("Received a post request!")
  console.log(req.body)
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
