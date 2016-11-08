<template>
  <form ref="form" @submit="uploadProtocol" action="http://127.0.0.1:5000/upload" method="POST" enctype="multipart/form-data" class='upload'>
    <div class="fileUpload">
      <span>Click or Drag to Upload </span>
      <input ref="input" @change="fileChange" type="file" name="file" class="upload" />
    </div>
  </form>
</template>

<script>
  export default {
    name: 'Upload',
    computed: {
      next() {
        return this.$store.state.tasks[0].placeables[0].href
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
        this.$router.push(this.next)
        return false
      }
    }
  }
</script>
