<template>
  <div ref='commands' class='runScreen'>
    <div id="exit" @click='clearRunScreen()'>x</div>
    <div class='runCommand' v-for='command in runLog'>
      {{command.timestamp}} - {{command.command_description}}
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
        if (this.$store.state.detached) {
          this.$store.dispatch('disconnectRobot')
        }
      }
    },
    watch: {
      runLog: function (val, oldVal) {
        this.$refs.commands.scrollTop = this.$refs.commands.scrollHeight
      }
    }
  }
</script>
