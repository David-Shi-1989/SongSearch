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
      <Table :columns="table.columns" :data="table.data" :height="450"></Table>
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
            rendered: (h, params) => {
              var downloadBtn = h('Button', {
                props: {
                  type: 'primary',
                  size: 'small'
                },
                on: {
                  click: () => {
                    alert('click')
                  }
                }
              })
              return downloadBtn
            }
          }
        ],
        data: []
      }
    }
  },
  methods: {
    onSearchBtnClick () {
      if (this.search.text) {
        this.$axios({
          methods: 'GET',
          url: '/singer/' + this.search.text
        }).then((res) => {
          this.table.data = res.data
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
</style>
