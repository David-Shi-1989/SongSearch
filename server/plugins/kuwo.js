const request = require('request')
const fs = require('fs')
const http = require('http')
const setting = require('./setting.json')
var kuwoDriver = {
  searchUrl: 'http://sou.kuwo.cn/ws/NSearch?type=music&key=%SINGER_NAME%&pn=%PAGE_CURRENT%',
  downloadUrl: 'http://antiserver.kuwo.cn/anti.s?format=aac|mp3&rid=%ID%&type=convert_url&response=res',
  // 从酷我搜索 歌手名
  searchSong: function (singerName, pageCurrent) {
    var me = this
    var current = pageCurrent || 1
    var headers = {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate',
      'Accept-Language': 'zh-CN,zh;q=0.9',
      'Cache-Control': 'max-age=0',
      'Connection': 'keep-alive',
      Host: 'sou.kuwo.cn',
      'Upgrade-Insecure-Requests': 1,
      'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36'
    }
    var formData = {
      type: 'music',
      key: singerName
    }
    var url = this.searchUrl.replace('%SINGER_NAME%', singerName).replace('%PAGE_CURRENT%', current)
    return new Promise(function (resolve, reject) {
      request.get({url: url, headers: headers, form: formData, gzip: true}, function (err, response2) {
        if (err) {
          reject(err)
        } else {
          var arr = me.handleHTML(response2.body)
          resolve(arr)
        }
      })
    })
  },
  // 处理酷我的html
  handleHTML: function (html) {
    function getSongNameAndHref (html) {
      var name = ''
      var href = ''
      var reg = /<p\s+class="m_name">[\w\W]*?<\/p>/g
      var nameMatchArr = html.match(reg)
      if (nameMatchArr.length > 0) {
        var nameHtml = nameMatchArr[0]
        var songHrefMatchArr = nameHtml.match(/href="[^"]+/g)
        var songNameMatchArr = nameHtml.match(/title="[^"]+/g)
        if (songHrefMatchArr.length > 0) {
          href = songHrefMatchArr[0].replace('href="', '')
        } else {
          throw new Error('Cannot match song\'s name in ' + songHrefMatchArr[0])
        }
        if (songNameMatchArr.length > 0) {
          name = songNameMatchArr[0].replace('title="', '')
        } else {
          throw new Error('Cannot match song\'s name in ' + songHrefMatchArr[0])
        }
      } else {
        throw new Error('Cannot match song\'s name in ' + html)
      }
      return {name, href}
    }
    function getSongAlbumName (html) {
      var album = ''
      var reg = /<p\s+class="a_name">[\w\W]*?<\/p>/g
      var albumMatchArr = html.match(reg)
      if (albumMatchArr.length > 0) {
        var titleMatchArr = albumMatchArr[0].match(/title="[^"]+/g)
        if (titleMatchArr && titleMatchArr.length > 0) {
          album = titleMatchArr[0].replace('title="', '')
        } else {
          console.log('Cannot match song\'s album name in ' + albumMatchArr[0])
        }
      } else {
        throw new Error('Cannot match song\'s album name in ' + html)
      }
      return album
    }
    function getSingerName (html) {
      var name = ''
      var reg = /<p\s+class="s_name">[\w\W]*?<\/p>/g
      var matchArr = html.match(reg)
      if (matchArr.length > 0) {
        var singerArr = matchArr[0].match(/title="[^"]+/g)
        if (singerArr.length > 0) {
          name = singerArr.map(function (item) {
            return item.replace('title="','')
          }).join('&')
        } else {
          throw new Error('Cannot match song\'s singer name in ' + matchArr[0])
        }
      } else {
        throw new Error('Cannot match song\'s singer name in ' + html)
      }
      return name
    }
    function getTotal (html) {
      var total = 0
      var reg = /相关歌曲<span>(\d+)<\/span>首/g
      var matchResult = reg.exec(html)
      if (matchResult[1]) {
        total = parseInt(matchResult[1])
      }
      return total
    }
    var songList = []
    var reg = /<div\s+class="list">[\w\W]*?<\/div>/g
    var containerHtmlMatchArr = html.match(reg)
    if (containerHtmlMatchArr && containerHtmlMatchArr.length > 0) {
      var containerHtml = containerHtmlMatchArr[0]
      var reg2 = /<li\s+class="clearfix">[\w\W]*?<\/li>/g
      var songsHtmlMatchArr = containerHtml.match(reg2)
      if (songsHtmlMatchArr && songsHtmlMatchArr.length > 0) {
        for (var i = 0; i < songsHtmlMatchArr.length; i++) {
          var curHtml = songsHtmlMatchArr[i]
          // 歌曲名和ID
          var id = ''
          var songNameHref = getSongNameAndHref(curHtml)
          var idMatchArr = songNameHref.href.match(/\d+/)
          if (idMatchArr.length > 0) {
            id = idMatchArr[0]
          }
          // 专辑名
          var albumName = getSongAlbumName(curHtml)
          // 歌手名
          var singerName = getSingerName(curHtml)
          songList.push({
            id: id,
            name: songNameHref.name,
            singer: singerName,
            album: albumName,
            from: 'kuwo'
          })
        }
      } else {
        console.log('No data found in page.')
      }
    } else {
      throw new Error('Cannot match div.list html list in Kuwo HTML')
    }
    return {list: songList, total: getTotal(html), pageSize: 25}
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
