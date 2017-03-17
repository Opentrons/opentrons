<template>
  <div id='protocol-info'>
    <span class='title'>File Name: </span>
    <span class='info'>{{fileName}}</span>
    <span class='title'>Last Modified: </span>
    <span class='info'>{{lastModified}}</span>
  </div>
</template>

<script>
  export default {
    name: 'Protocol',
    computed: {
      fileName () {
        return this.$store.state.fileName
      },
      lastModified () {
        return this.$store.state.lastModified
      }
    }
  }
</script>
