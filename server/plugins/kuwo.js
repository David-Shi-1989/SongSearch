// const request = require('request')
const getKuwoList = require('../walker/nightmare')
const fs = require('fs')
const http = require('http')
const setting = require('./setting.json')
var kuwoDriver = {
  searchUrl: 'http://www.kuwo.cn/search/list?key=%SINGER_NAME%', // &pn=%PAGE_CURRENT%
  downloadUrl: 'http://antiserver.kuwo.cn/anti.s?format=aac|mp3&rid=%ID%&type=convert_url&response=res',
  // 从酷我搜索 歌手名
  searchSong: async function (singerName, pageCurrent) {
    return Promise.resolve(await getKuwoList(singerName))
  },
  // 根据歌曲id获取实际下载地址
  getSongUrl: function (id) {
    var url = this.downloadUrl.replace('%ID%', id)
    return new Promise(function (resolve, reject) {
      http.get(url, function (res) {
        var location = res.headers.location
        if (location) {
          resolve(location)
        } else {
          reject(new Error('Cannot get music location from kuwo with music id ' + id))
        }
      })
    })
  },
  // 下载歌曲
  downloadSong: function (id, fileName) {
    var path = setting.filePath.replace('%FROM%','kuwo').replace('%FILENAME%',fileName) + '.aac'
    var me = this
    return new Promise(function (resolve, reject) {
      me.getSongUrl(id).then((location) => {
        http.get(location, function (res, err) {
          var buffers = []
          res.on('data', function (data) {
            buffers.push(data)
          })
          res.on('end', function () {
            var fileBuffer = Buffer.concat(buffers)
            fs.writeFile(path, fileBuffer, function (err) {
              if (err) {
                reject(new Error('fail to save audio file.' + path))
              } else {
                resolve(true)
              }
            })
          })
        })
      })
    })
  }
}
module.exports = kuwoDriver
