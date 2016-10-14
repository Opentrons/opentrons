<template>
  <div>
    <section>
      <h2 class="title center">Upload a Protocol</h2>
      <div class="instructions center">
        Upload a valid JSON or Python Protocol. Errors will display below.
      </div>
      <div class="step step-upload">
        <input id="uploadFile" disabled="disabled">{{fileName}}</input>
        <div class="fileUpload">
          <span>Upload</span>
          <input @change="onFileChange" id="uploadBtn" type="file" class="upload" />
        </div>
      </div>

      <navigation :prev="prev" :next="next"></navigation>
    </section>
    <!-- <span>
      ERRORS: {{errors}}
    </span> -->
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
    next: "/",
    prev: "/connect"
    }
  },
  computed: {
    fileName () {
      return this.$store.state.current_protocol_name
    },
    connected () {
      return this.$store.state.is_connected
    },
    errors () {
      return this.$store.state.errors
    }
  },
  methods: {
    onFileChange(e) {
      var files = e.target.files || e.dataTransfer.files
      if (!files.length)
        return;
      var reader = new FileReader();
      reader.fileName = files[0].name
      reader.onload = this.uploadProtocol
      reader.readAsText(files[0], 'UTF-8');
    },
    uploadProtocol(event) {
      var target = event.target
      console.log(target.fileName)
      this.$store.dispatch("uploadProtocol", target)
      this.$store.dispatch("updateTasks", target)
    }
  }
}
</script>

<style>
  .center {
    text-align: center;
  }
</style>
