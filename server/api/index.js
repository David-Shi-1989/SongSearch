const express = require('express')
const router = express.Router()
var KuwoDriver = require('../plugins/kuwo')

router.post('/search/:name', function (req, res) {
  let singerName = req.params.name
  let pageCurrent = req.body.pageIndex || 1
  KuwoDriver.searchSong(singerName, pageCurrent).then((body) => {
    res.send(body)
  })
})
router.post('/download/:id', function (req, res) {
  var data = req.body
  var fileName = data.name + ' - ' + data.singer
  var id = req.params.id
  KuwoDriver.downloadSong(id, fileName).then((isSuccess) => {
    res.send(isSuccess)
  })
})
router.post('/getSongSrc/:id', function (req, res) {
  var id = req.params.id
  KuwoDriver.getSongUrl(id).then((src) => {
    res.send(src)
  })
})

module.exports = router
