<template>
  <div id="protocol-info">
    <span class="title">File Name: </span>
    <span class="info">{{fileName}}</span>
    <span class="title">Date Created: </span>
    <span class="info">10/10/16</span>
  </div>
</template>

<script>
  export default {
    name: "Protocol",
    computed: {
      fileName () {
        return this.$store.state.fileName
      }
    }
  }
</script>
