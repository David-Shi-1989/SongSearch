<template>
  <div>
    <div class="sww-form-wrap">
      <Form label-width="140">
        <FromItem label="来源">
          <Select v-model="from">
            <Option value="kuwo">酷我</Option>
            <Option value="kugou">酷狗</Option>
          </Select>
        </FromItem>
      </Form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'songSearch',
  data () {
    return {
      from: 'kuwo'
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
