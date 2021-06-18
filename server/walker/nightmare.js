const Nightmare = require('nightmare')
const nm = Nightmare({show: false})




module.exports = function (singerName) {
  return new Promise((resolve, reject) => {
    nm.goto('http://www.kuwo.cn/search/list?key=' + encodeURIComponent(singerName))
      .wait('div.container')
      .exists('ul.search_list')
      .evaluate(() => {
        function getPage () {
          let page = document.querySelector('.page-wrap ul > li:last-child').innerText
          if (/^\d+$/.test(page)) {
            return parseInt(page)
          } else {
            return -1
          }
        }
        function getId (dom) {
          const href = dom.querySelector('.song_name a').href
          if (href) {
            let match = href.match(/\d+$/)
            if (match) {
              return match[0]
            }
          }
          return null
        }
        function getName (dom) {
          const href = dom.querySelector('.song_name a')
          if (href) {
            return href.innerText
          }
          return null
        }
        function getSinger (dom) {
          const href = dom.querySelector('.song_artist')
          if (href) {
            return href.innerText
          }
          return null
        }
        function getAlbum (dom) {
          const href = dom.querySelector('.song_album')
          if (href) {
            return href.innerText
          }
          return null
        }
        function getTime (dom) {
          const href = dom.querySelector('.song_time')
          if (href) {
            return href.innerText
          }
          return null
        }
        function getCover (dom) {
          const href = dom.querySelector('.song_rank img.cover')
          if (href) {
            return href.src
          }
          return null
        }
        let result = {
          pageSize: 0,
          page: getPage(),
          list: []
        }
        let list = document.querySelectorAll('ul.search_list > li')
        if (result.page > 1) {
          result.pageSize = list.length
        }
        for (let i = 0; i < list.length; i++) {
          let curItem = list[i]
          result.list.push({
            id: getId(curItem),
            name: getName(curItem),
            singer: getSinger(curItem),
            album: getAlbum(curItem),
            time: getTime(curItem),
            cover: getCover(curItem),
            from: 'kuwo'
          })
        }
        return result
      }).then(res => {
        resolve(res)
      })
  })
}