<template>
  <div id="app">
    <el-container>
      <el-header>
        <my-header />
      </el-header>
      <el-container>
        <el-aside width="200px">Aside</el-aside>
        <el-main>
          <router-view />
        </el-main>

      </el-container>
      <el-footer>
        <my-footer />
      </el-footer>
    </el-container>
  </div>
</template>

<script>
import MyHeader from '@/components/header/Header.vue'
import MyFooter from '@/components/footer'
import { mapActions } from 'vuex';
export default {
  name: 'App',
  components: {
    MyHeader,
    MyFooter
  },
  methods: {
    ...mapActions(['init'])
  },
  created() {
    this.init()
  }
}
</script>

<style></style>
