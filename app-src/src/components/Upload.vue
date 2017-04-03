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
        return this.$store.state.tasks.deck !== undefined
      },
      busy () {
        return this.$store.state.busy
      }
    },
    watch: {
      taskListLen: function () {
        var deck = this.$store.state.tasks.deck
        if (deck && deck[0] && deck[0].slot) {
          this.$router.push(deck[0].href)
        } else {
          this.$router.push('/')
        }
      }
    }
  }
</script>
