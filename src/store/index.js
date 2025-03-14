import Vue from 'vue'
import Vuex from 'vuex'
import { user } from '@/api'

Vue.use(Vuex)

const UserCache = {
  key: '_sp_user_id',
  get: function () {
    return localStorage.getItem(this.key) || ''
  },
  set: function (value) {
    localStorage.setItem(this.key, value)
  }
}

const store = new Vuex.Store({
  state: {
    userList: [],
    currentUser: UserCache.get(),
    songMenus: []
  },
  getters: {
    userList: (state) => state.userList,
    audioList: () => []
  },
  mutations: {
    setCurrentUser (state, userId) {
      state.currentUser = userId
      UserCache.set(userId)
    },
    setUserList (state, list) {
      state.userList = list
    }
  },
  actions: {
    init({ dispatch }) {
      dispatch('fetchUserList')
    },
    async fetchUserList({ commit }) {
      const userList = await user.list()
      commit('setUserList', userList)
    }
  }
})

export default store