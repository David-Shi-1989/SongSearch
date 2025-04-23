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
    songMenus: [],
    ablumn: {
      selectedId: '',
      list: [
        { name: '内地歌曲', id: 'a01', createTime: 1742529605280, list: [], createdBy: '001' },
        { name: '英文歌曲', id: 'a02', createTime: 1742529605280, list: [], createdBy: '001' }
      ]
    }
  },
  getters: {
    userList: (state) => state.userList,
    audioList: () => [],
    ablumnList: (state) => state.ablumn.list,
    selectedAblumId: (state) => state.ablumn.selectedId
  },
  mutations: {
    setCurrentUser (state, userId) {
      state.currentUser = userId
      UserCache.set(userId)
    },
    setUserList (state, list) {
      state.userList = list
    },
    setSelectedAblum (state, id) {
      state.ablumn.selectedId = id
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