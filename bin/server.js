const path = require('path');
const express = require('express')
const app = express()
const Check = require('./check')

app.use(express.static(path.join(__dirname, "/../assets")));

app.get('/getChecks', async (req, res) => {
  res.json(await Check.checksForToday())
})

app.patch('/check/:checkSeq', async (req,res) => {
  let CheckSeq = req.params.checkSeq
  let check = await Check.find(CheckSeq)
  check.ShowItem = !check.ShowItem
  check.save()
  res.sendStatus(200)
})

app.get('/*', (req,res) => {
  res.sendFile(path.join(__dirname, "/../assets", "index.html"));
})

module.exports = app