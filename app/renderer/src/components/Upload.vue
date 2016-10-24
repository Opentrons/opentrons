<template>
  <div>
    <section>
      <h2 class="title">Upload a Protocol</h2>
      <div class="instructions">
        Upload a valid JSON or Python Protocol. Errors will display below.
      </div>
      <div class="error">
        <div v-show="error" >
          <span class="error">!</span>
          Error: {{error}}
        </div>
      </div>
      <form ref="form" @submit="uploadProtocol" action="http://127.0.0.1:5000/upload" method="POST" enctype="multipart/form-data" class="step step-upload">
        <div class="fileUpload">
          <span>{{fileName}}</span>
          <input ref="input" @change="fileChange" type="file" name="file" class="upload"/>
        </div>
      </form>
      <Navigation :prev="prev" :next="next"></Navigation>
    </section>
  </div>
</template>

<script>
  import Navigation from './Navigation.vue'

  export default {
    name: 'Upload',
    components: {
      Navigation
    },
    data: function () {
      return {
      prev: "/connect"
      }
    },
    computed: {
      fileName () {
        return this.$store.state.fileName
      },
      connected () {
        return this.$store.state.is_connected
      },
      error () {
        return this.$store.state.error
      },
      next () {
        if (this.$store.state.tasks[0]) {
          return this.$store.state.tasks[0].placeables[0].href
        } else {
          return '/'
        }
      }
    },
    methods: {
      fileChange(e) {
        var files = e.target.files || e.dataTransfer.files
        if (!files.length)
          return;
        var fileName = files[0].name
        this.$store.dispatch("updateFilename", fileName)
        this.uploadProtocol()
      },
      uploadProtocol() {
        let formData = new FormData();
        formData.append("file", this.$refs.form.file.files[0])
        this.$store.dispatch("uploadProtocol", formData)
        return false
      }
    }
  }
</script>
