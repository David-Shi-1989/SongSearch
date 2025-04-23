<template>
  <div class="ablum_item" :class="wrapClass" @click="onSelect">
    <div class="ablum_item__header">
      <el-avatar shape="square" :size="50" :src="thumb"></el-avatar>
      <div class="ablum_item__header__right">
        <p>{{ obj.name }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import defaultImg from '@/assets/imgs/ablum-thumbnail.jpg'
import { mapGetters, mapMutations } from 'vuex';

export default {
  name: 'AblumItem',
  props: {
    obj: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    ...mapGetters(['selectedAblumId']),
    thumb() {
      return this.obj.thumb || defaultImg
    },
    wrapClass() {
      return {
        'is-selected': this.obj.id === this.selectedAblumId
      }
    }
  },
  methods: {
    ...mapMutations(['setSelectedAblum']),
    onSelect() {
      this.setSelectedAblum(this.obj.id)
    }
  }
}
</script>

<style lang="scss" scoped>
@use '@/scss/color' as *;

.ablum_item {
  border: 1px solid #ccc;
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
  &.is-selected {
    border-color: $color-primary;
  }
  &__header {
    display: flex;
    &__right {
      margin-left: 5px;
    }
  }
}
</style>
