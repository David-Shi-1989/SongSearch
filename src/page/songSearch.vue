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
    <div>
      <div class="sww-table-wrap">
        <Row>
          <iCol span="15">
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
          </iCol>
          <iCol span="8" offset="1">
            <Card>
              <p slot="title">歌曲列表</p>
              <Tabs value="sumList">
                <TabPane label="歌曲库" name="sumList">
                  <div style="height:400px;overflow-x:hidden;overflow-y:auto;">
                    <Row v-for="(item,idx) in list.download" class="css-download-list-item">
                      <iCol span="4">{{idx+1}}</iCol>
                      <iCol span="14">{{item.name + ' - ' + item.singer}}</iCol>
                      <iCol span="3"><img class="css-download-logo" :src="'/static/image/'+item.from+'-music.png'"></iCol>
                      <iCol span="3"><span :class="['css-download-status','s-'+item.status]"></span></iCol>
                    </Row>
                  </div>
                </TabPane>
                <TabPane label="下载列表" name="downList">标签二的内容</TabPane>
                <TabPane label="最爱歌曲" name="favList">标签三的内容</TabPane>
              </Tabs>
            </Card>
          </iCol>
        </Row>
      </div>
    </div>
    <div>
      <audioPlayer ref="audioPlayer"></audioPlayer>
    </div>
  </div>
</template>

<script>
import audioPlayer from '@/components/audio-player'
import { setInterval, clearInterval } from 'timers';
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
      },
      list: {
        download: [
          // {name: '1ttt23', from: 'qq', id: '123', status: 0}
        ]
      },
      timer: {
        downloadLoop: null
      }
    }
  },
  mounted () {
    this.timer.downloadLoop = setInterval(this.loopTheDownloadList.bind(this), 500)
  },
  destroyed () {
    clearInterval(this.timer.downloadLoop)
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
      let from = this.search.from
      if (!this.isDownloadListExist(id, from)) {
        this.list.download.push({id, name, singer, status: 0, from})
      }
    },
    isDownloadListExist (id, from) {
      return this.list.download.some(function (item) {
        return (item.from === from && item.id === id)
      })
    },
    loopTheDownloadList () {
      let isDownloading = this.list.download.some(function (item) {
        return item.status === 1
      })
      if (isDownloading) {
        return
      }
      for (let i = 0; i < this.list.download.length; i++) {
        let curSong = this.list.download[i]
        if (curSong.status === 0) {
          curSong.status = 1
          this.doDownLoad(curSong.id, curSong.name, curSong.singer, curSong.from).then((isSuccess) => {
            curSong.status = isSuccess ? 2 : -1
          })
          return
        }
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
    doDownLoad (id, name, singer, from) {
      debugger
      var me = this
      return new Promise(function (resolve, reject) {
        if (id && name && singer) {
          me.$Loading.start()
          me.$axios({
            method: 'POST',
            url: '/api/download/' + id,
            data: {
              name: name,
              singer: singer,
              from: from
            }
          }).then(res => {
            if (res.data) {
              me.$Loading.finish()
              // this.$Message.success('下载成功!')
              resolve(true)
            } else {
              me.$Loading.error()
              resolve(false)
              // this.$Message.error('下载失败!')
            }
          })
        }
      })
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
  },
  watch: {
  }
}
</script>
<style scoped>
.sww-form-wrap {
  width: 400px;
  margin-bottom: 20px;
}
.sww-page-wrap {
  text-align: right;
  margin-top: 10px;
}
/*下载列表*/
.css-download-list-item {
  cursor: pointer;
  --item-height: 30px;
  height: var(--item-height);
  line-height: var(--item-height);
}
.css-download-list-item > div {
  height: var(--item-height);
  line-height: var(--item-height);
}
.css-download-list-item:hover{
  background-color: #eee;
}
img.css-download-logo{
  --logo-size: 20px;
  width: var(--logo-size);
  height: var(--logo-size);
  margin-top: calc((var(--item-height) - var(--logo-size)) / 2);
}
.css-download-status {
  font-size: 12px;
}
.css-download-status.s-0{
  color: #888;
}
.css-download-status.s-0::after{
  content: "等待";
}
.css-download-status.s-1{
  color: #333;
}
.css-download-status.s-1::after{
  content: "下载中";
}
.css-download-status.s-2{
  color: #19be6b;
}
.css-download-status.s-2::after{
  content: "成功";
}
.css-download-status.s--1{
  color: #ed4014;
}
.css-download-status.s--1::after{
  content: "失败";
}
</style>
