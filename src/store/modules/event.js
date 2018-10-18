var state = {
  router: {
    beforeChange: 0,
    afterChange: 0
  }
}

var getters = {
  getRouterBeforeChange: state => {
    return state.router.beforeChange
  },
  getRouterAfterChange: state => {
    return state.router.afterChange
  }
}

var mutations = {
  triggerRouterBeforeChange: (state) => {
    state.router.beforeChange++
  },
  triggerRouterAfterChange: (state, to, from) => {
    state.router.afterChange++
  }
}

var actions = {

}

export default {
  namespaved: true,
  state,
  getters,
  actions,
  mutations
}
