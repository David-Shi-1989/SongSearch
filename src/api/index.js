import axios from 'axios'

const PREFIX = '/api'

function myGet(url) {
  return new Promise(resolve => {
    axios.get(url).then(res => {
      resolve(res?.data?.result)
    })
  })
}
export const user = {
  list: () => {
    return myGet(PREFIX + '/user/list')
  }
}

export const hifiti = {
  search: (keyword, page = 1) => {
    return axios.get(PREFIX + '/hifiti/search', { params: { keyword, page }, timeout: 90000 }).then(res => {
      if (!res.data || res.data.success === false) {
        return Promise.reject(new Error((res.data && res.data.message) || '搜索失败'))
      }
      return res.data.result
    })
  },
  play: ({ link, title, onReady, onDone }) => {
    return fetch('http://localhost:3000/api/hifiti/play', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ link, title })
    }).then(async (res) => {
      if (!res.body) {
        throw new Error('播放失败')
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let ready = null
      let done = null
      const handleLine = (line) => {
        if (!line.trim()) return
        const event = JSON.parse(line)
        if (event.type === 'ready') {
          ready = event
          if (onReady) onReady(event)
        } else if (event.type === 'done') {
          done = event
          if (onDone) onDone(event)
        } else if (event.type === 'error') {
          throw new Error(event.message || '播放失败')
        }
      }
      let chunk = await reader.read()
      while (!chunk.done) {
        buffer += decoder.decode(chunk.value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()
        lines.forEach(handleLine)
        chunk = await reader.read()
      }
      if (buffer.trim()) handleLine(buffer)
      return done || ready
    })
  },
  download: ({ link, title }) => {
    return axios.post(PREFIX + '/hifiti/download', { link, title }, { timeout: 120000 }).then(res => {
      if (!res.data || res.data.success === false) {
        return Promise.reject(new Error((res.data && res.data.message) || '下载失败'))
      }
      return res.data.result
    })
  }
}

export const author = {
  list: () => {
    return myGet(PREFIX + '/author/list')
  },
  info: (id) => {
    return myGet(PREFIX + '/author/' + id)
  },
  songs: (id, page, size, keyword) => {
    return myGet(PREFIX + `/author/${id}/songs?page=${page}&size=${size}` + (keyword ? `&keyword=${keyword}` : ''))
  }
}
