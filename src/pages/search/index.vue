<template>
  <div id="hifiti-search">
    <div class="search-bar">
      <el-input
        v-model="keyword"
        placeholder="输入歌手或歌曲关键字"
        clearable
        @keyup.enter.native="onSearch"
      />
      <el-button type="primary" :loading="isLoading" @click="onSearch">搜索</el-button>
    </div>
    <p class="search-tip">搜索会使用后端账号自动登录 HiFiTi。结果有多页时先显示第 1 页，切换页码后再抓取对应页。</p>
    <p v-if="summary" class="search-summary">{{ summary }}</p>
    <el-alert
      v-if="notice"
      class="search-notice"
      :title="notice"
      type="warning"
      show-icon
      :closable="false"
    />
    <div class="search-result">
    <div class="search-toolbar">
      <el-button
        type="primary"
        size="small"
        :disabled="!selection.length || chromeBusy"
        :loading="batchDownloading"
        @click="onBatchDownload"
      >批量下载{{ selection.length ? `（${selection.length}）` : '' }}</el-button>
      <span v-if="batchProgress" class="batch-progress">{{ batchProgress }}</span>
    </div>
    <el-table
      ref="searchTable"
      class="search-table"
      :data="list"
      row-key="link"
      v-loading="isLoading"
      stripe
      height="100%"
      @selection-change="onSelectionChange"
    >
      <el-table-column type="selection" width="48" reserve-selection />
      <el-table-column prop="title" label="主题" min-width="320">
        <template slot-scope="scope">
          <a class="song-link" :href="scope.row.link" target="_blank" rel="noopener noreferrer">{{ scope.row.title }}</a>
        </template>
      </el-table-column>
      <el-table-column prop="author" label="作者" width="140" />
      <el-table-column prop="date" label="时间" width="140" />
      <el-table-column label="网盘" min-width="180">
        <template slot-scope="scope">{{ (scope.row.pans || []).join(' ') }}</template>
      </el-table-column>
      <el-table-column prop="views" label="浏览" width="90" />
      <el-table-column label="操作" width="170" fixed="right">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="success"
            icon="el-icon-video-play"
            :loading="preparingLink === scope.row.link"
            :disabled="chromeBusy && preparingLink !== scope.row.link"
            @click="onPlay(scope.row)"
          >播放</el-button>
          <el-button
            size="mini"
            type="primary"
            :loading="downloadingLink === scope.row.link"
            :disabled="chromeBusy && downloadingLink !== scope.row.link"
            @click="onDownload(scope.row)"
          >下载</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="search-pagination">
      <el-pagination
        background
        :current-page="page"
        :page-size="pagerSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="onPageChange"
      />
    </div>
    </div>
  </div>
</template>

<script>
import { hifiti } from '@/api'

export default {
  name: 'HifitiSearch',
  data() {
    return {
      keyword: '',
      summary: '',
      notice: '',
      list: [],
      total: 0,
      page: 1,
      pageCount: 1,
      pageCache: {},
      searchedKeyword: '',
      isLoading: false,
      downloadingLink: '',
      preparingLink: '',
      playingLink: '',
      chromeBusy: false,
      selection: [],
      batchDownloading: false,
      batchProgress: '',
      searchRequestId: 0
    }
  },
  computed: {
    pagerSize() {
      const pages = this.pageCount || 1
      const total = this.total || 0
      if (pages <= 1) return Math.max(total, this.list.length, 1)
      return Math.max(1, Math.ceil(total / pages))
    }
  },
  methods: {
    onPlay(row) {
      if (!row || !row.link || this.chromeBusy) return
      const artistMatch = String(row.title || '').match(/^(.+?)《/)
      const titleMatch = String(row.title || '').match(/《([^》]+)》/)
      let started = false
      this.chromeBusy = true
      this.preparingLink = row.link
      hifiti.play({
        link: row.link,
        title: row.title,
        onReady: (event) => {
          started = true
          this.preparingLink = ''
          this.playingLink = row.link
          this.$store.commit('setCurrentMusic', {
            title: (titleMatch && titleMatch[1]) || row.title,
            artist: (artistMatch && artistMatch[1].trim()) || '未知',
            src: event.mp3Url,
            pic: 'https://moeplayer.b0.upaiyun.com/aplayer/secretbase.jpg'
          })
          this.$message.success('已开始播放，并在后台下载')
        },
        onDone: (event) => {
          if (event && event.ok) {
            this.$message.success(event.message || '已保存到本地')
          } else if (event) {
            this.$message.warning((started ? '在线播放已开始，但本地保存失败：' : '') + (event.message || '播放失败'))
          }
        }
      }).catch((err) => {
        if (!started) this.$message.error(err.message || '播放失败')
      }).finally(() => {
        this.preparingLink = ''
        this.chromeBusy = false
      })
    },
    onSelectionChange(rows) {
      this.selection = rows || []
    },
    async onBatchDownload() {
      const rows = this.selection.filter((row) => row && row.link)
      if (!rows.length || this.chromeBusy) return
      this.chromeBusy = true
      this.batchDownloading = true
      let okCount = 0
      let failedCount = 0
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        this.downloadingLink = row.link
        this.batchProgress = `正在下载 ${i + 1}/${rows.length}：${row.title}`
        try {
          const result = await hifiti.download({ link: row.link, title: row.title })
          if (result && result.ok) okCount += 1
          else failedCount += 1
        } catch (err) {
          failedCount += 1
        }
      }
      this.downloadingLink = ''
      this.batchDownloading = false
      this.batchProgress = ''
      this.chromeBusy = false
      const summary = `批量下载完成：成功 ${okCount} 首，失败 ${failedCount} 首`
      if (failedCount) this.$message.warning(summary)
      else this.$message.success(summary)
    },
    onDownload(row) {
      if (!row || !row.link || this.chromeBusy) return
      this.chromeBusy = true
      this.downloadingLink = row.link
      hifiti.download({ link: row.link, title: row.title }).then((result) => {
        const message = (result && result.message) || '已尝试下载'
        if (result && result.ok) {
          this.$message.success(message)
        } else {
          this.$message.warning(message)
        }
      }).catch((err) => {
        this.$message.error(err.message || '下载失败')
      }).finally(() => {
        this.downloadingLink = ''
        this.chromeBusy = false
      })
    },
    onSearch() {
      if (this.chromeBusy) return
      const keyword = this.keyword.trim()
      if (!keyword) {
        this.$message.warning('请输入歌手或歌曲关键字')
        return
      }
      this.pageCache = {}
      this.selection = []
      if (this.$refs.searchTable) this.$refs.searchTable.clearSelection()
      this.searchedKeyword = keyword
      this.page = 1
      this.total = 0
      this.pageCount = 1
      this.loadPage(keyword, 1, true)
    },
    onPageChange(nextPage) {
      if (this.isLoading || this.chromeBusy || nextPage === this.page) return
      if (!this.searchedKeyword) return
      this.loadPage(this.searchedKeyword, nextPage, false)
    },
    loadPage(keyword, nextPage, isNewSearch) {
      const cached = this.pageCache[nextPage]
      if (cached) {
        this.page = nextPage
        this.list = cached
        return
      }
      const previousPage = this.page
      const requestId = ++this.searchRequestId
      this.isLoading = true
      this.page = nextPage
      if (isNewSearch) this.notice = ''
      hifiti.search(keyword, nextPage).then((result) => {
        if (requestId !== this.searchRequestId) return
        this.summary = (result && result.summary) || ''
        this.notice = (result && result.notice) || ''
        this.total = Number(result && result.total) || 0
        this.pageCount = Number(result && result.pageCount) || 1
        this.list = (result && result.list) || []
        this.$set(this.pageCache, nextPage, this.list)
        if (isNewSearch && !this.list.length && !this.notice) {
          this.$message.info('没有找到相关歌曲')
        }
      }).catch((err) => {
        if (requestId !== this.searchRequestId) return
        this.page = isNewSearch ? 1 : previousPage
        if (isNewSearch) {
          this.summary = ''
          this.notice = ''
          this.list = []
          this.total = 0
          this.pageCount = 1
        }
        this.$message.error(err.message || '搜索失败')
      }).finally(() => {
        if (requestId === this.searchRequestId) this.isLoading = false
      })
    }
  }
}
</script>

<style lang="scss" scoped>
#hifiti-search {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  .search-bar {
    display: flex;
    gap: 12px;
    max-width: 640px;
    flex-shrink: 0;
  }
  .search-tip,
  .search-summary {
    margin: 12px 0;
    color: #606266;
    flex-shrink: 0;
  }
  .search-notice {
    margin-bottom: 12px;
    flex-shrink: 0;
  }
  .search-result {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  .search-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
    margin-bottom: 8px;
  }
  .batch-progress {
    color: #606266;
    font-size: 13px;
  }
  .search-table {
    flex: 1;
    min-height: 0;
  }
  .search-pagination {
    display: flex;
    justify-content: flex-end;
    flex-shrink: 0;
    padding-top: 12px;
  }
  .song-link {
    color: #409eff;
    text-decoration: none;
  }
  .el-button + .el-button {
    margin-left: 6px;
  }
}
</style>
