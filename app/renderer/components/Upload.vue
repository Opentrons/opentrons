<template>
  <span :class='{disabled: busy}'>
    <form ref='form' class='upload'>
      <div class='fileUpload'>
        <span>{{this.uploadMessage()}}</span>
        <input ref='input' @change='uploadProtocol' type='file' name='file' class='upload' />
      </div>
    </form>
  </span>
</template>

<script>
  export default {
    name: 'Upload',
    methods: {
      uploadProtocol () {
        let formData = new FormData()
        let file = this.$refs.form.file.files[0]
        formData.append('file', file)
        formData.append('lastModified', file.lastModifiedDate.toDateString())
        this.$store.dispatch('uploadProtocol', formData)
        this.$refs.form.reset()
        return false
      },
      uploadMessage () {
        return this.$store.state.uploading.uploading ? 'Processing...' : 'Click to Upload'
      }
    },
    computed: {
      taskListLen () {
        return this.$store.state.tasks.length > 0
      },
      busy () {
        return this.$store.state.busy
      }
    },
    watch: {
      taskListLen: function () {
        if (this.$store.state.tasks[0]) {
          this.$router.push(this.$store.state.tasks[0].placeables[0].href)
        } else {
          this.$router.push('/')
        }
      }
    }
  }
</script>
