<template>
  <el-dropdown :class="wrapClass" trigger="click" v-model="selectedUser" @visible-change="onDrop" @command="onChange">
    <span class="el-dropdown-link">
      <el-avatar src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"></el-avatar>
      <i class="el-icon-arrow-down el-icon--right"></i>
    </span>
    <el-dropdown-menu slot="dropdown" class="sp-user-dropdown__list">
      <el-dropdown-item v-for="item in formattedUserList" :key="item.id" :command="item.id"
        :class="{ 'is-active': item.isSelected }">
        {{ item.name }}
        <i v-if="item.isSelected" class="el-icon-check"></i>
      </el-dropdown-item>
      <el-dropdown-item divided icon="el-icon-circle-plus" command="add-user" class="add-user">添加用户</el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>

<script>
import { mapGetters, mapMutations, mapState } from 'vuex';

export default {
  name: 'AvatarDropdown',
  components: {},
  data() {
    return {
      selectedUser: '',
      isExpand: false
    }
  },
  computed: {
    ...mapGetters(['userList']),
    ...mapState(['currentUser']),
    wrapClass() {
      return {
        'sp-user-dropdown': true,
        'is-expand': this.isExpand
      }
    },
    formattedUserList() {
      return this.userList.map(user => Object.assign({}, user, { isSelected: user.id === this.currentUser }))
    }
  },
  methods: {
    ...mapMutations(['setCurrentUser']),
    onDrop(isShow) {
      this.isExpand = isShow
    },
    onChange(command) {
      if (command === 'add-user') {
        console.log(command)
      } else {
        this.setCurrentUser(command)
      }
    }
  },
  watch: {
    currentUser: {
      immediate: true,
      handler() {
        this.selectedUser = this.currentUser
      }
    }
  }
}
</script>

<style lang="scss">
.sp-user-dropdown {
  .el-dropdown-link {
    display: flex;
    align-items: end;
    cursor: pointer;
  }

  i.el-icon--right {
    transition: all .2s;
    margin-bottom: 10px;
  }

  &.is-expand {
    i.el-icon--right {
      transform: rotate(90deg);
    }
  }

  &__list {
    .is-active {
      color:#67C23A;
    }
    .add-user {
      i {
        color: #409EFF;
      }

      color: #409EFF;
    }
  }
}
</style>
