<template>
  <div id="sp_footer">
    <vue-aplayer class="sp-footer-player"
    :music="{
      title: 'secret base~君がくれたもの~',
      artist: 'Silent Siren',
      src: 'https://moeplayer.b0.upaiyun.com/aplayer/secretbase.mp3',
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
