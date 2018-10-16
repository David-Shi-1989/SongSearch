import Vue from 'vue'
import Router from 'vue-router'
import HelloWorld from '@/components/HelloWorld'
import SongSearch from '@/page/songSearch'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/song',
      name: 'SongSearch',
      component: SongSearch
    },
    {
      path: '/',
      name: 'HelloWorld',
      component: HelloWorld
    }
  ]
})
