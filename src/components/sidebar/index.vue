<template>
  <div id="sidebar">
    <ablum-item v-for="item in ablumnList" :key="item.id" :obj="item" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import AblumItem from './ablum.vue'

export default {
  name: 'MySidebar',
  components: {AblumItem},
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters(['ablumnList'])
  }
}
</script>

<style lang="scss" scoped>
#sidebar {
  background-color: khaki;
  height: 100%;
  padding: 20px 10px;
  & > .ablum_item {
    &:not(:last-child) {
      margin-bottom: 10px;
    }
  }
}
</style>
