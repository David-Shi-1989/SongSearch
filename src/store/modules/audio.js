var state = {
  songList: [],
  isPlay: false
}

var getters = {
  getSongList: state => state.songList,
  getIsAudioPlay: state => state.isPlay
}

var mutations = {
  addSongToList: (state, paramObj) => {
    var songObj = paramObj.list
    if (typeof (songObj) === 'object') {
      var isReplace = paramObj.isReplace || false
      if (Array.prototype.isPrototypeOf(songObj)) {
        var isValid = songObj.every(function (item) {
          return (item.title && item.src)
        })
        if (isValid) {
          state.songList = isReplace ? songObj : state.songList.concat(songObj)
        } else {
          throw new Error('Wrong Format in songList ', songObj)
        }
      } else {
        if (songObj.title && songObj.src) {
          state.songList = isReplace ? [songObj] : state.songList.concat([songObj])
        } else {
          throw new Error('Wrong Format in songList ', songObj)
        }
      }
    }
    if (paramObj.isPlay) {
      state.isPlay = true
    }
  },
  playAudio: (state) => {
    state.isPlay = true
  },
  pauseAudio: (state) => {
    state.isPlay = false
  }
}

var actions = {

}

export default {
  namespaved: true,
  state,
  getters,
  actions,
  mutations
}
