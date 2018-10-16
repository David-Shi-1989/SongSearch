const express = require('express')
const path = require('path')
const fs = require('fs')
const bodyParser = require('body-parser')
const app = express()
const webpack = require('webpack')
const webpackDevMiddleware = require('webpack-dev-middleware')

const webpackServerConfig = require('../build/webpack.server.conf')
const compiler = webpack(webpackServerConfig)

const DIST_DIR = path.join(__dirname, '../', 'dist')

var KuwoDriver = require('./plugins/kuwo')

app.use(express.static(path.join(__dirname, 'static')))

app.get('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'X-Requested-With')
  res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS')
  var headerContentType = ''
  if (req.url.endsWith('js')) {
    headerContentType = 'application/javascript'
  } else if (req.url.endsWith('css')) {
    headerContentType = 'text/css'
  } else {
    headerContentType = 'application/json;charset=utf-8'
  }
  res.header('Content-Type', headerContentType)
  next()
  // var filePath = path.join(__dirname, '../', req.url)
  // fs.readFile(filePath, function (err, fr) {
  //   if (err) {

  //   } else {
  //     res.writeHead(200, {'Content-Type': headerContentType})
  //     res.end(fr)
  //   }
  // })
})
app.use('/static', express.static('static'))

app.use(webpackDevMiddleware(compiler, {
  publicPath: webpackServerConfig.output.publicPath,
  noInfo: true
}))
app.use(require('webpack-hot-middleware')(compiler))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

app.get(['/', '/index.html'], (req, res, next) => {
  const filename = path.join(DIST_DIR, 'index.html')
  compiler.outputFileSystem.readFile(filename, function (err, result) {
    if (err) {
      return next(err)
    }
    res.header('Content-Type', 'text/html; charset=UTF-8')
    res.send(result)
    res.end()
  })
})
app.get(['/bootstrap.html'], (req, res) => {
  fs.readFile(path.join(__dirname, '../bootstrap/index.html'), function (err, fr) {
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
  var id = req.params.id
  KuwoDriver.downloadSong(id, fileName).then((isSuccess) => {
    res.send(isSuccess)
  })
})
app.listen(3000, () => {
  console.log('App listening on port 3000')
})
