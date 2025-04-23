<template>
  <div id="sp_footer">
    <vue-aplayer class="sp-footer-player"
    :music="{
      title: 'secret base~君がくれたもの~',
      artist: 'Silent Siren',
      src: 'http://localhost:3000/mp3/SHE/SHE%E3%80%8A%E4%B8%80%E7%9C%BC%E4%B8%87%E5%B9%B4%E3%80%8B[FLAC-MP3-320K].mp3',
      pic: 'https://moeplayer.b0.upaiyun.com/aplayer/secretbase.jpg'
    }" />
  </div>
</template>

<script>
import VueAplayer from 'vue-aplayer'
import { mapGetters } from 'vuex';

export default {
  name: 'MyFooter',
  components: {
    VueAplayer
  },
  computed: {
    ...mapGetters('audioList')
  }
}
</script>

<style lang="scss" scoped>
.sp-footer-player {
  margin: 0;
}
</style>
