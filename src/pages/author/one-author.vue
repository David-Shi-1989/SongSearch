<template>
  <div id="author_page">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item :to="{ name: 'Home' }">主页</el-breadcrumb-item>
      <el-breadcrumb-item>{{ authorName }}</el-breadcrumb-item>
    </el-breadcrumb>
    <div class="author-info">
      <el-avatar icon="el-icon-user-solid"></el-avatar>
      <span class="author-info__total">已收录{{ total }}首歌曲</span>
    </div>
    <div class="author-song-wrap">
      <div style="margin: 10px 0 0 0; display: flex;">
        <el-button type="danger" size="mini" :disabled="!hasSelections">删除</el-button>
        <el-input v-model="keyword" size="mini" placeholder="请输入搜索内容" style="margin-left: 20px;width: 250px;"
          @change="onKeywordChange"></el-input>
      </div>
      <el-table class="author-song-wrap__table" :data="formattedTableData" v-loading="isLoading" size="small" max-height="550px"
        :row-class-name="tableRowClassName" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="index" label="#" width="100"></el-table-column>
        <el-table-column prop="title" label="歌曲名称"></el-table-column>
        <el-table-column prop="text" label="原链接文本">
          <template slot-scope="scope">
            <span style="margin-right: 5px;">{{ scope.row.text }}</span>
            <el-tooltip class="item" effect="dark" :content="scope.row.id" placement="top-start">
              <i class="el-icon-info" />
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="本地已下载" width="150">
          <template slot-scope="scope">
            <i :class="['is-exist', scope.row.isExist ? 'el-icon-success' : 'el-icon-remove']"></i>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" show-overflow-tooltip></el-table-column>
      </el-table>
      <div style="display: flex; justify-content: flex-end; flex-shrink: 0;">
        <el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :current-page.sync="page"
          :page-size="size" layout="total, prev, pager, next" :total="total">
        </el-pagination>
      </div>
    </div>
  </div>
</template>

<script>
import { author } from '@/api';
import { debounce } from 'lodash';

export default {
  name: 'AuthorPage',
  data() {
    return {
      id: this.$route.params.id,
      authorInfo: null,
      tableData: [],
      page: 1,
      size: 30,
      isLoading: false,
      multipleSelection: [],
      keyword: ''
    }
  },
  created() {
    this.onKeywordChange = debounce(this.fetchSongsByAuthorId, 800)
    this.fetchData()
  },
  methods: {
    fetchData() {
      this.fetchAuthorInfo()
      this.fetchSongsByAuthorId()
    },
    async fetchAuthorInfo() {
      this.authorInfo = await author.info(this.id)
    },
    async fetchSongsByAuthorId() {
      this.isLoading = true
      this.tableData = await author.songs(this.id, this.page, this.size, this.keyword)
      this.isLoading = false
    },
    tableRowClassName({ row }) {
      const { isExist } = row
      return isExist ? 'success-row' : ''
    },
    handleSizeChange() { },
    handleCurrentChange(value) {
      this.page = value
      this.fetchSongsByAuthorId()
    },
    handleSelectionChange(val) {
      this.multipleSelection = val;
    }
  },
  computed: {
    authorName() {
      return this.authorInfo?.name
    },
    total() {
      return this.authorInfo?.songs_number
    },
    formattedTableData() {
      return this.tableData.map((row, idx) => {
        return {
          ...row,
          index: (this.page - 1) * this.size + idx + 1
        }
      })
    },
    hasSelections() {
      return this.multipleSelection.length > 0
    }
  }
}
</script>

<style lang="scss">
#author_page {
  display: flex;
  flex-direction: column;
  height: 100%;
  .author-info {
    display: flex;
    align-items: center;
    margin-top: 20px;
    &__total {
      font-size: 13px;
      color:#909399;
    }
  }
  .author-song-wrap {
    flex-grow: 1;
    height: 100%;
    display: flex;
    flex-direction: column;

    &__table {
      .success-row {
        background-color: #f0f9eb;
      }

      i.is-exist {
        &.el-icon-success {
          color: #67C23A;
        }

        &.el-icon-remove {
          color: #909399;
        }
      }
    }
  }
}
</style>
