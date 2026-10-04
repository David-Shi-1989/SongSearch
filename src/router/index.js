import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/pages/home'
import AuthorList from '@/pages/author/table-list.vue'
import OneAuthor from '@/pages/author/one-author.vue'
import Search from '@/pages/search/index.vue'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
      path: '/search',
      name: 'Search',
      component: Search
    },
    {
      path: '/author',
      name: 'Author',
      component: AuthorList
    },
    {
      path: '/author/:id',
      name: 'OneAuthor',
      component: OneAuthor
    }
  ]
})