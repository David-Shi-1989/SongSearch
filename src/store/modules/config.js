var state = {
  menus: [
    {title: '主页', to: '/', icon: 'fa fa-object-group', badge: 0},
    {title: '博客', to: '/blog', icon: 'fa fa-space-shuttle', badge: 8},
    {title: '相册', to: '/album', icon: 'fa fa-thermometer', badge: 3},
    {title: '状态', to: '/post', icon: 'fa fa-tty', badge: 0},
    {title: '作品', to: '/demo', icon: 'fa fa-github', badge: 1}
  ]
}

var getters = {
  getMenus: state => {
    return state.menus
  }
}

var mutations = {
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
