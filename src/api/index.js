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
