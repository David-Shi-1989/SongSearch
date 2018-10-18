import Vue from 'vue'
import Vuex from 'vuex'
import _global from './modules/global'
import _config from './modules/config'
import _event from './modules/event'
Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    global: _global,
    config: _config,
    event: _event
  }
})
