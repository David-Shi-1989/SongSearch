<template>
  <div class="sww-page-wrap">
    <div class="sww-form-wrap">
      <Input v-model="search.text">
        <Select v-model="search.from" slot="prepend" style="width: 80px">
          <Option value="kuwo">酷我</Option>
          <Option value="kugou">酷狗</Option>
        </Select>
        <Button slot="append" icon="ios-search" @click="onSearchBtnClick"></Button>
      </Input>
    </div>
    <div>
      <Table
        :columns="table.columns"
        :data="table.data"
        :height="600"
        stripe
        :loading="table.isLoading"
        size="small"
      ></Table>
      <div class="sww-page-wrap">
        <Page :total="table.total" :page-size="table.pageSize" show-elevator show-total size="small" />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'songSearch',
  data () {
    return {
      search: {
        from: 'kuwo',
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
              var iconBtn = h('Icon', {
                props: {
                  type: 'md-download',
                  size: '16'
                },
                attrs: {
                  title: '下载',
                  'data-id': params.row.id,
                  'data-from': params.row.from,
                  'data-name': params.row.name,
                  'data-singer': params.row.singer
                },
                style: {
                  cursor: 'pointer'
                },
                on: {
                  click: function (evt) {
                    var dataSet = evt.currentTarget.dataset
                    me.$axios({
                      method: 'POST',
                      url: '/download/' + dataSet.id,
                      data: {
                        name: dataSet.name,
                        singer: dataSet.singer
                      }
                    }).then((res) => {
                      if (res.data) {
                        me.$Message.success('下载成功!')
                      } else {
                        me.$Message.error('下载失败!')
                      }
                    })
                  }
                }
              })
              var progressBar = h('Progress', {
                props: {
                  'stroke-width': 5,
                  percent: 0
                }
              })
              return h('div', {}, [iconBtn, progressBar])
            }
          }
        ],
        data: [],
        total: 0,
        pageSize: 25
      }
    }
  },
  methods: {
    onSearchBtnClick () {
      if (this.search.text) {
        this.table.isLoading = true
        this.$axios({
          methods: 'GET',
          url: '/singer/' + this.search.text
        }).then((res) => {
          this.table.isLoading = false
          this.table.data = res.data.list
          this.table.total = res.data.total
        })
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
