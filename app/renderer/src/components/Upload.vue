<template>
  <div>
    <form ref="form" @submit="uploadProtocol" action="http://127.0.0.1:5000/upload" method="POST" enctype="multipart/form-data" class='upload'>
      <div class="fileUpload">
        <span v-if="!fileName">Click or Drag to Upload </span>
        <span>{{fileName}}</span>
        <input ref="input" @change="fileChange" type="file" name="file" class="upload" />
      </div>
    </form>
  </div>
</template>

<script>
  export default {
    name: 'Upload',
    computed: {
      fileName () {
        return this.$store.state.fileName
      }
    },
    methods: {
      fileChange(e) {
        let files = e.target.files || e.dataTransfer.files
        this.uploadProtocol()
      },
      uploadProtocol() {
        let formData = new FormData();
        formData.append("file", this.$refs.form.file.files[0])
        this.$store.dispatch("uploadProtocol", formData)
        this.$router.push('/')
        return false
      }
    }
  }
</script>
