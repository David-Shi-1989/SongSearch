const express = require('express')
const path = require('path')
const fs = require('fs')
const bodyParser = require('body-parser')
const app = express()

var KuwoDriver = require('./plugins/kuwo')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true}))
app.use(express.static(path.join(__dirname, 'static')))

app.get('/static/*', function (req, res, next) {
  var headerContentType = ''
  if (req.url.endsWith('js')) {
    headerContentType = 'application/javascript'
  } else if (req.url.endsWith('css')) {
    headerContentType = 'text/css'
  }
  var filePath = path.join(__dirname, '../', req.url)
  fs.readFile(filePath, function (err, fr) {
    if (err) {

    } else {
      res.writeHead(200, {'Content-Type':headerContentType})
      res.end(fr)
    }
  })
})

app.get(['/','/index.html'], (req, res) => {
  fs.readFile(path.join(__dirname, '../src/index.html'), function (err, fr) {
    if (err) {

    } else {
      res.header('Content-Type', 'text/html; charset=UTF-8')
      res.send(fr)
      res.end()
    }
  })
})
app.get('/singer/:name', function (req, res) {
  let singerName = req.params.name
  KuwoDriver.searchSinger(singerName).then((body) => {
    res.send(body)
  })
})
app.post('/download/:id', function (req, res) {
  var data = req.body
  var fileName = data.name + ' - ' + data.singer
  KuwoDriver.downloadSong(data.id, fileName).then((isSuccess) => {
    res.send(isSuccess)
  })
})
app.listen(3000, () => {
  console.log('App listening on port 3000')
})