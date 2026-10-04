<template>
  <div id="sp_footer">
    <vue-aplayer ref="player" class="sp-footer-player" :music="music" />
  </div>
</template>

<script>
import VueAplayer from 'vue-aplayer'
import { mapState } from 'vuex';

const defaultMusic = {
  title: 'secret base~君がくれたもの~',
  artist: 'Silent Siren',
  src: 'http://localhost:3000/mp3/SHE/SHE%E3%80%8A%E4%B8%80%E7%9C%BC%E4%B8%87%E5%B9%B4%E3%80%8B[FLAC-MP3-320K].mp3',
  pic: 'https://moeplayer.b0.upaiyun.com/aplayer/secretbase.jpg'
}

export default {
  name: 'MyFooter',
  components: {
    VueAplayer
  },
  computed: {
    ...mapState(['currentMusic']),
    music() {
      return this.currentMusic || defaultMusic
    }
  },
  watch: {
    currentMusic(music) {
      if (!music || !music.src) return
      this.$nextTick(() => {
        if (this.$refs.player) this.$refs.player.thenPlay()
      })
    }
  }
}
</script>

<style lang="scss" scoped>
#sp_footer {
  height: 100%;
  display: flex;
  align-items: center;
}
.sp-footer-player {
  width: 100%;
  margin: 0;
  box-shadow: none;
}
</style>
