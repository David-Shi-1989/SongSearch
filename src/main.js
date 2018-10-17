// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'

import 'babel-polyfill'
import iview from 'iview'
import '../node_modules/iview/dist/styles/iview.css'
import $ from 'jquery'
import Axios from 'axios'
import '../static/vendor/audioPlayer/js/audio'
import '../node_modules/font-awesome/css/font-awesome.css'

Vue.use(iview)

Vue.config.productionTip = false
Vue.prototype.$axios = Axios

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>',
  $: $
})
