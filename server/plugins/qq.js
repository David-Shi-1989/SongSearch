const request = require('request')
const fs = require('fs')
const http = require('http')
const setting = require('./setting.json')
var convertUtil = require('../utils/convertAudoFormat')
var QQMusicDriver = {
  searchUrl: 'https://c.y.qq.com/soso/fcgi-bin/client_search_cp?ct=24&qqmusic_ver=1298&new_json=1&remoteplace=txt.yqq.center&searchid=38694266684520015&t=0&aggr=1&cr=1&catZhida=1&lossless=0&flag_qc=0&p=%PAGE_CURRENT%&n=20&w=%SINGER_NAME%&g_tk=5381&jsonpCallback=%CALL_BACK&loginUin=0&hostUin=0&format=jsonp&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq&needNewCode=0', //'http://sou.kuwo.cn/ws/NSearch?type=music&key=%SINGER_NAME%&pn=%PAGE_CURRENT%',
  downloadUrl: 'http://antiserver.kuwo.cn/anti.s?format=aac|mp3&rid=%ID%&type=convert_url&response=res',
  vKeyUrl: 'https://u.y.qq.com/cgi-bin/musicu.fcg',
  songSrcPrefix: 'http://124.89.197.20/amobile.music.tc.qq.com/',
  callbackName: 'MusicJsonCallback13100777853610057',
  callbackName2: 'getplaysongvkey7349741100341796',
  // 从QQ音乐搜索 歌手名
  searchSong: function (singerName, pageCurrent) {
    var me = this
    var current = pageCurrent || 1
    var headers = {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate',
      'Accept-Language': 'zh-CN,zh;q=0.9',
      'Cache-Control': 'max-age=0',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': 1,
      'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36'
    }
    // var formData = {
    //   type: 'music',
    //   key: singerName
    // }
    var url = this.searchUrl.replace('%SINGER_NAME%', encodeURIComponent(singerName)).replace('%PAGE_CURRENT%', current).replace('%CALL_BACK%', this.callbackName)
    return new Promise(function (resolve, reject) {
      request.get({url: url, headers: headers, gzip: true}, function (err, response2) {
        if (err) {
          reject(err)
        } else {
          var arr = me.handleSearchListHtml(response2.body)
          resolve(arr)
        }
      })
    })
  },
  // 根据歌曲id获取实际地址,后续还需格式转化m4a->mp3
  getOriginalSongUrl: function (songId) {
    var me = this
    var guid = '464820006'
    var headers = {
      accept: '*/*',
      'accept-encoding': 'gzip, deflate, br',
      referer: 'https://y.qq.com/portal/player.html',
      'user-agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36'
    }
    var paramData = {
      "req_0": {
        "module":"vkey.GetVkeyServer",
        "method":"CgiGetVkey",
        "param": {
          "guid": guid,
          "songmid": [songId.toString()],
          "songtype": [0],
          uin: '0',
          loginflag: 1,
          "platform":"20"
        }
      },
      "comm": {
        "uin": 0,
        "format":"json",
        "ct":20,
        "cv":0
      }
    }
    var params = {
      callback: this.callbackName2,
      g_tk: 5381,
      jsonpCallback: this.callbackName2,
      loginUin: 0,
      hostUin: 0,
      format: 'jsonp',
      inCharset: 'utf8',
      outCharset: 'utf-8',
      notice: 0,
      platform: 'yqq',
      needNewCode: 0,
      data: JSON.stringify(paramData)
    }
    var paramStr = ''
    for (var key in params) {
      paramStr += (key + '=' + encodeURIComponent(params[key])) + '&'
    }
    var url = this.vKeyUrl + '?' + paramStr
    return new Promise(function (resolve, reject) {
      request.get({url: url, headers: headers, gzip: true}, function (err, response2) {
        if (!err) {
          var src = me.handleVkeyHtml(response2.body)
          resolve(src)
        } else {
          reject(err)
        }
      })
    })
  },
  getSongUrl: function (songId, name, singer) {
    var fileName = name + ' - ' + singer
    var me = this
    return new Promise(function (resolve, reject) {
      me.downloadSong(songId, fileName).then((outputPath) => {
        resolve(outputPath)
      }).catch((e) => {
        throw e
      })
    })
  },
  // 处理QQ音乐的html
  handleSearchListHtml: function (html) {
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
    function getSingerName (singerArr) {
      return singerArr.map(function (item) {return item.name}).join('&')
    }
    function getTotal (data) {
      return data.data.song.totalnum
    }
    html = html.slice(html.indexOf('(')+1)
    html = html.slice(0, html.length - 1)
    var data = JSON.parse(html)
    var songList = []
    for (let i = 0; i < data.data.song.list.length; i++) {
      let curItem = data.data.song.list[i]
      songList.push({
        id: curItem.mid,
        name: curItem.name,
        singer: getSingerName(curItem.singer),
        album: curItem.album.name,
        // url: curItem.url,
        from: 'qq'
      })
    }
    return {list: songList, total: getTotal(data), pageSize: 25}
  },
  handleVkeyHtml: function (html) {
    html = html.slice(html.indexOf('(')+1)
    html = html.slice(0, html.length - 1)
    var data = JSON.parse(html)
    if (data && data.req_0.data.midurlinfo.length > 0) {
      // 成功拿到歌曲的url
      var src = data.req_0.data.midurlinfo[0].purl
      return this.songSrcPrefix + src
    } else {
      // 拿不到
      throw new Error('获取不到url')
    }
  },
  // 下载歌曲
  downloadSong: function (id, fileName) {
    var savePath = setting.filePath.replace('%FROM%','qq').replace('%FILENAME%',fileName) + '.m4a'
    var me = this
    return new Promise(function (resolve, reject) {
      me.getOriginalSongUrl(id).then((location) => {
        http.get(location, function (res, err) {
          var buffers = []
          res.on('data', function (data) {
            buffers.push(data)
          })
          res.on('end', function () {
            var fileBuffer = Buffer.concat(buffers)
            fs.writeFile(savePath, fileBuffer, function (err) {
              if (err) {
                reject(new Error('fail to save audio file.' + savePath))
              } else {
                var outPath = setting.filePath.replace('%FROM%','qq').replace('%FILENAME%',fileName) + '.mp3'
                convertUtil.covertFormat(savePath, outPath).then((outputPath) => {
                  fs.unlink(outPath.replace('.mp3','.m4a'))
                  resolve(outputPath)
                }).catch((e) => {
                  throw e
                })
              }
            })
          })
        })
      })
    })
  }
}
module.exports = QQMusicDriver
