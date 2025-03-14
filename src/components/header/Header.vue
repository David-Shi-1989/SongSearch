<template>
  <div id="header">
    <ul>
      <li>
        <router-link :to="{name: 'Home'}">主页</router-link>
      </li>
      <li>
        <router-link :to="{name: 'Author'}">歌手</router-link>
      </li>
      <li>
        <avatar-dropdown />
      </li>
    </ul>
  </div>
</template>

<script>
import avatarDropdown from './avatar-dropdown.vue';
export default {
  name: 'MyHeader',
  components: {
    avatarDropdown
  }
}
</script>

<style lang="scss" scoped>
#header {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  ul {
    display: flex;
    align-items: center;
    & > li {
      padding: 0 10px;
      a {
        color: #777;
        text-decoration: none;
        &.router-link-exact-active {
          background-color: coral;
          border-radius: 15px;
          padding: 10px 20px;
          color: #fff;
        }
      }
    }
  }
}
</style>
