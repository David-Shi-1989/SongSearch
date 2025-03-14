<template>
  <div id="author_list">
    <el-table
      class="author-list-table"
      :data="tableData"
      stripe
      v-loading="isLoading"
      height="90%"
    >
      <el-table-column prop="name" label="名字"></el-table-column>
      <el-table-column prop="songs_number" label="歌曲数量">
        <template slot-scope="scope">
          <router-link :to="{name: 'OneAuthor', params : { id: scope.row.id}}">{{ scope.row.songs_number }}</router-link>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { author } from '@/api'

export default {
  name: 'AuthorList',
  data() {
    return {
      tableData: [],
      isLoading: false
    }
  },
  created() {
    this.fetchList()
  },
  methods: {
    fetchList() {
      this.isLoading = true
      author.list().then(list => {
        this.tableData = list
        this.isLoading = false
      })
    }
  }
}
</script>

<style lang="scss" scoped>
#author_list {
  height: 100%;
  display: flex;
  flex-direction: row;
  .author-list-table {
    height: 100%;
    flex: 1;
  }
}
</style>
