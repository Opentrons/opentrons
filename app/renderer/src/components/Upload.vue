<template>
  <form ref="form" @submit="uploadProtocol" action="http://127.0.0.1:5000/upload" method="POST" enctype="multipart/form-data" class='upload'>
    <div class="fileUpload">
      <span>Click to Upload </span>
      <input @drop.prevent.stop ref="input" @change="fileChange" type="file" name="file" class="upload" />
    </div>
  </form>
</template>

<script>
  export default {
    name: 'Upload',
    methods: {
      fileChange(e) {
        let files = e.target.files || e.dataTransfer.files
        this.uploadProtocol()
      },
      uploadProtocol() {
        let formData = new FormData();
        let file = this.$refs.form.file.files[0]
        formData.append("file", file)
        formData.append("lastModified", file.lastModifiedDate.toDateString())
        this.$store.dispatch("uploadProtocol", formData)
        return false
      }
    },
    computed: {
      taskListLen (){
        return this.$store.state.tasks.length > 0
      }
    },
    watch: {
      taskListLen: function() {
        if (this.$store.state.tasks[0]) {
          this.$router.push(this.$store.state.tasks[0].placeables[0].href)
        }
      }
    }
  }
</script>
