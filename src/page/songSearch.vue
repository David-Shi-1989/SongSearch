<template>
  <div class="sww-song-page-wrap">
    <div class="sww-form-wrap">
      <Input v-model="search.text">
        <Select v-model="search.from" slot="prepend" style="width: 80px">
          <Option value="kuwo">酷我</Option>
          <Option value="qq">QQ音乐</Option>
        </Select>
        <Button slot="append" icon="ios-search" @click="onSearchBtnClick"></Button>
      </Input>
    </div>
    <div class="sww-table-wrap">
      <Table
        :columns="table.columns"
        :data="table.data"
        :height="500"
        stripe
        :loading="table.isLoading"
        size="small"
      ></Table>
      <div class="sww-page-wrap">
        <Page
          :total="pagingTool.total"
          :page-size="pagingTool.pageSize"
          :current="pagingTool.current"
          show-elevator
          show-total
          size="small"
          @on-change="onPageCurrentChange"
          @on-page-size-change="onPageSizeChange"/>
      </div>
    </div>
    <div>
      <audioPlayer ref="audioPlayer"></audioPlayer>
    </div>
  </div>
</template>

<script>
import audioPlayer from '@/components/audio-player'
export default {
  name: 'songSearch',
  components: {audioPlayer},
  data () {
    return {
      search: {
        from: 'qq',
        text: ''
      },
      table: {
        isLoading: false,
        columns: [
          {
            title: '歌曲名称',
            key: 'name'
          },
          {
            title: '歌手',
            key: 'singer'
          },
          {
            title: '专辑',
            key: 'album'
          },
          {
            title: '操作',
            render: (h, params) => {
              var me = this
              var downloadIconBtn = h('i', {
                attrs: {
                  class: 'fa fa-download',
                  title: '下载',
                  'data-id': params.row.id,
                  'data-from': params.row.from,
                  'data-name': params.row.name,
                  'data-singer': params.row.singer
                },
                style: {
                  cursor: 'pointer',
                  fontSize: '16px',
                  marginRight: '15px'
                },
                on: {
                  click: function (evt) {
                    var dataSet = evt.currentTarget.dataset
                    me.onDownloadBtnClick(dataSet.id, dataSet.name, dataSet.singer)
                  }
                }
              })
              var playIconBtn = h('i', {
                attrs: {
                  class: 'fa fa-music',
                  title: '播放',
                  'data-id': params.row.id,
                  'data-from': params.row.from,
                  'data-name': params.row.name,
                  'data-singer': params.row.singer,
                  'data-url': params.row.url
                },
                style: {
                  cursor: 'pointer',
                  fontSize: '16px'
                },
                on: {
                  click: function (evt) {
                    var dataSet = evt.currentTarget.dataset
                    me.onPlayBtnClick(dataSet) // (dataSet.id, dataSet.name, dataSet.singer, dataSet.from, dataSet.url)
                  }
                }
              })
              return h('div', {}, [downloadIconBtn, playIconBtn])
            }
          }
        ],
        data: [],
        total: 0,
        pageSize: 25
      },
      pagingTool: {
        total: 0,
        pageSize: 25,
        current: 1
      },
      resetPageEnum: {
        pageCurrentChange: 0,
        beginSearch: 1
      }
    }
  },
  methods: {
    initData () {
      this.table.isLoading = true
      this.$Loading.start()
      this.$axios({
        method: 'POST',
        url: '/api/search/' + this.search.text,
        data: {
          pageIndex: this.pagingTool.current,
          from: this.search.from
        }
      }).then(res => {
        this.table.isLoading = false
        this.$Loading.finish()
        this.table.data = res.data.list
        this.pagingTool.total = res.data.total
      })
    },
    onSearchBtnClick () {
      if (this.search.text) {
        this.resetPage(this.resetPageEnum.beginSearch)
        this.initData()
      }
    },
    onDownloadBtnClick (id, name, singer) {
      if (id && name && singer) {
        this.$Loading.start()
        this.$axios({
          method: 'POST',
          url: '/api/download/' + id,
          data: {
            name: name,
            singer: singer,
            from: this.search.from
          }
        }).then(res => {
          if (res.data) {
            this.$Loading.finish()
            this.$Message.success('下载成功!')
          } else {
            this.$Loading.error()
            this.$Message.error('下载失败!')
          }
        })
      }
    },
    onPlayBtnClick (dataSet) {
      this.$Loading.start()
      var me = this
      var id = dataSet.id
      var name = dataSet.name
      var singer = dataSet.singer
      var url = dataSet.url
      var from = dataSet.from || this.search.from
      getSongUrl().then((url) => {
        let commitData = {
          list: {title: name + ' - ' + singer, src: url},
          isReplace: true,
          isPlay: true
        }
        this.$store.commit('addSongToList', commitData)
      }).catch((e) => {
        this.$Loading.error()
        this.$Message.error('播放失败!')
        throw e
      })
      function getSongUrl () {
        return new Promise(function (resolve, reject) {
          debugger
          if (url) {
            resolve(url)
          } else if (id) {
            me.$axios({
              method: 'POST',
              url: '/api/getSongSrc/' + id,
              data: {
                name: name,
                singer: singer,
                from: from
              }
            }).then(res => {
              if (res.data) {
                resolve(res.data)
              } else {
                reject(new Error('获取歌曲url失败'))
                this.$Loading.error()
                this.$Message.error('播放失败!')
              }
            })
          }
        })
      }
    },
    // pagingTool
    onPageCurrentChange (newCurrent) {
      this.pagingTool.current = newCurrent
      this.resetPage(this.resetPageEnum.pageCurrentChange)
      this.initData()
    },
    onPageSizeChange (newPageSize) {
      alert('onPageSizeChange')
    },
    resetPage (mode) {
      var isScrollBack = true
      switch (mode) {
        case this.resetPageEnum.pageCurrentChange:
          // do nothing
          break
        case this.resetPageEnum.beginSearch:
          this.pagingTool.current = 1
          break
        default:
          break
      }
      if (isScrollBack) {
        tableScroolTopBack()
      }
      function tableScroolTopBack () {
        $('.sww-table-wrap .ivu-table-body.ivu-table-overflowY').scrollTop(0)
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.sww-form-wrap {
  width: 400px;
  margin-bottom: 20px;
}
.sww-page-wrap {
  text-align: right;
  margin-top: 10px;
}
</style>
