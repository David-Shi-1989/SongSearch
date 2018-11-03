const express = require('express')
const router = express.Router()
var KuwoDriver = require('../plugins/kuwo')
var QQMusicDriver = require('../plugins/qq')

router.post('/search/:name', function (req, res) {
  let singerName = req.params.name
  let pageCurrent = req.body.pageIndex || 1
  switch (req.body.from) {
    case 'kuwo':
      KuwoDriver.searchSong(singerName, pageCurrent).then((body) => {
        res.send(body)
      })
      break
    case 'qq':
      QQMusicDriver.searchSong(singerName, pageCurrent).then((body) => {
        res.send(body)
      })
      break
    default:
      res.send('Wrong param from ' + req.body.from)
      break
  }
})
router.post('/download/:id', function (req, res) {
  var data = req.body
  var fileName = data.name + ' - ' + data.singer
  var id = req.params.id
  switch (data.from) {
    case 'kuwo':
      KuwoDriver.downloadSong(id, fileName).then((isSuccess) => {
        res.send(isSuccess)
      })
      break
    case 'qq':
      QQMusicDriver.downloadSong(id, fileName).then((isSuccess) => {
        res.send(isSuccess)
      })
      break
    default:
      res.send('Wrong param from ' + req.body.from)
      break
  }
})
router.post('/getSongSrc/:id', function (req, res) {
  var id = req.params.id
  var data = req.body
  switch (data.from) {
    case 'kuwo':
      KuwoDriver.getSongUrl(id).then((src) => {
        res.send(src)
      })
      break
    case 'qq':
      QQMusicDriver.getSongUrl(id, data.name, data.singer).then((src) => {
        res.send(src.replace('./static/', '/static/'))
      })
      break
    default:
      res.send('Wrong param from ' + req.body.from)
      break
  }
})

module.exports = router
