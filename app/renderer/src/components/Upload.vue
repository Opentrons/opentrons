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
    <div id="info" class="infoModal">
      <div> <a href="#close" title="Close" class="close">X</a>
        <h2>Title</h2>
        <p>
          Images would go here along with explanation text.
        </p>
      </div>
    </div>
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
      return this.$store.state.is_connected;
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
      this.$store.dispatch("uploadProtocol", target)
    }
  }
}
</script>

<style>
  .center {
    text-align: center;
  }
</style>
