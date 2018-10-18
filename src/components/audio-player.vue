<template>
  <div class="audio-box">
    <div class="audio-container">
      <div class="audio-view">
        <div class="audio-cover"></div>
          <div class="audio-body">
          <h3 class="audio-title">未知歌曲</h3>
          <div class="audio-backs">
            <div class="audio-this-time">00:00</div>
            <div class="audio-count-time">00:00</div>
            <div class="audio-setbacks">
              <i class="audio-this-setbacks">
                <span class="audio-backs-btn"></span>
              </i>
              <span class="audio-cache-setbacks"></span>
            </div>
          </div>
        </div>
        <div class="audio-btn">
          <div class="audio-select">
            <i class="fa fa-fast-backward" action="prev"></i>
            <i class="fa fa-play" action="play" data-on="fa fa-play" data-off="fa fa-pause"></i>
            <i class="fa fa-fast-forward" action="next"></i>
            <!--<div action="menu" class="icon-list-alt"></div>-->
            <div action="volume" class="icon-volume-up">
              <div class="audio-set-volume">
                <div class="volume-box">
                  <i><span  class="audio-backs-btn"></span></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      songList: [],
      audioFn: null
    }
  },
  mounted () {
    this.init()
    this.play()
  },
  methods: {
    init () {
      var setConfig = {
        song: this.songList,
        error: function (msg) {
          alert(msg)
        }
      }
      this.audioFn = this.$plugins.audioPlay(setConfig)
    },
    play () {
      if (this.songList.length > 0 && this.audioFn) {
        this.audioFn.loadFile(1)
      }
    },
    playThisSong (title, src) {
      if (title && src) {
        this.songList = [{title, src}]
      }
      this.init()
      this.play()
    }
  }
}
</script>

<style scoped>
.audio-box {
  position: fixed;
  width: 100%;
  bottom: 0;
  left: 0;
  background-color: #121212;
  color: #fafafa;
}
.audio-container {
  width: 1100px;
  margin: auto;
}
.audio-view {
  position: relative;
  height: 80px;
  overflow: hidden;
  transition: all 0.6s ease;
  -webkit-transition: all 0.6s ease;
}
.audio-cover {
  float: left;
  width: 80px;
  height: 80px;
  background-size: auto 100%;
  background-repeat: no-repeat;
  background-position: center center;
  background-color: #535353;
}
.audio-cover img {
  display: block;
  height: 100%;
  margin: auto;
}
.audio-body {
  width: 770px;
  float: left;
  padding: 0 10px;
}
.audio-title {
  font-weight: 400;
  font-size: 14px;
  line-height: 40px;
  overflow: hidden;
}
.audio-backs {
  position: relative;
  padding-left: 50px;
  padding-right: 50px;
  height: 20px;
}
.audio-this-time,
.audio-count-time {
  position: absolute;
  top: 0;
  width: 50px;
  font-size: 14px;
  height: 20px;
  line-height: 20px;
}
.audio-this-time {
  left: 0;
}
.audio-count-time {
  right: 0;
  text-align: right;
}
.audio-setbacks {
  width: 650px;
  margin: 0 10px;
  height: 6px;
  border-radius: 3px;
  background-color: #333;
  cursor: pointer;
}
.audio-setbacks {
  position: relative;
  top: 30%;
}
.audio-cache-setbacks,
.audio-this-setbacks {
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  border-radius: 3px;
}
.audio-cache-setbacks {
  width: 0;
  background-color: #535353;
  z-index: 1;
  cursor: pointer;
  transition: width 0.6s ease;
  -webkit-transition: width 0.6s ease;
}
.audio-this-setbacks {
  background-color: #c70c0c;
  z-index: 2;
}
.audio-backs-btn {
  position: absolute;
  right: -3px;
  margin-top: -3px;
  width: 12px;
  height: 12px;
  background-color: #fafafa;
  border-radius: 50%;
  cursor: pointer;
}
.audio-btn {
  position: absolute;
  width: 200px;
  height: 100px;
  right: 0;
  top: 0;
}
.audio-select {
  height: 20px;
  margin-top: 40px;
  /* width: 120px; */
  float: right;
  font-size: 14px;
  text-align: center;
  transition: all 0.6s ease;
  -webkit-transition: all 0.6s ease;
}
.audio-select > i {
  display: block;
  width: 15px;
  height: 15px;
  float: left;
  margin-right: 10px;
  cursor: pointer;
}
.audio-select > div {
  position: relative;
  width: 125px;
  height: 20px;
  background-size: 100% 100%;
  background-position: center center;
  background-repeat: no-repeat;
  float: left;
  cursor: pointer;
  margin-top: 5px;
}
.audio-select > div + div {
  margin-left: 10px;
}
.audio-set-volume {
  box-sizing: border-box;
  /* position: absolute; */
  /* right: -120px; */
  /* bottom: 0; */
  width: 120px;
  height: 15px;
  padding-left: 15px;
  /* z-index: 999; */
  transition: 0.6s width ease;
}
.volume-box {
  border-radius: 6px;
  width: 100%;
  height: 6px;
  background-color: #333;
}
.volume-box i {
  border-radius: 6px;
  position: relative;
  display: block;
  width: 0;
  height: 100%;
  background-color: #c70c0c;
}
</style>
