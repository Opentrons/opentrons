<template>
  <div ref='commands' class='runScreen'>
    <div id="exit-wrapper">
      <h3 @click='clearRunScreen()' id='exit'>x  </h3>
    </div>
    <div class='runCommand' v-for='command in runLog()'>
      {{command.timestamp}} - {{command.command_description}}
      <br>
    </div>
  </div>
</template>

<script>
  export default {
    methods: {
      clearRunScreen () {
        this.$store.dispatch('finishRun')
      },
      runLog () {
        return this.$store.state.runLog
      }
    },
    watch: {
      runLog: function (val, oldVal) {
        this.$refs.commands.scrollTop = this.$refs.commands.scrollHeight
      }
    }
  }
</script>
