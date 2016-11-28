<template>
  <div ref='commands' class='runScreen'>
    <h3 @click='clearRunScreen()' id='exit'>x</h3>
    <div class='runCommand' v-for='command in runLog'>
      {{command.timestamp}} - {{command.command_description}}
      <br>
    </div>
  </div>
</template>

<script>
  export default {
    computed: {
      runLog () {
        return this.$store.state.runLog
      }
    },
    methods: {
      clearRunScreen () {
        this.$store.dispatch('finishRun')
      }
    },
    watch: {
      runLog: function (val, oldVal) {
        this.$refs.commands.scrollTop = this.$refs.commands.scrollHeight
      }
    }
  }
</script>
