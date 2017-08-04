<template>
  <div ref='commands' class='runScreen'>
    <div id="exit" @click='clearRunScreen()'>x</div>
    <div class='runCommand' v-for='command in runLog'>
      {{command.timestamp}}: {{ applyIndent(command.command_description) }}
    </div>
  </div>
</template>

<script>
  export default {
    computed: {
      runLog() {
        return this.$store.state.runLog
      }
    },
    methods: {
      applyIndent(msg) {
        const starCount = msg.split(/\*/).length - 1
        const stars = Array(starCount + 1).join('*')
        let msgArrows = stars
          .replace('*', '\u21B3') // Replace first asterisk with arrow
          .split('').reverse().join('') // Move arrow to end of string
          .replace(/\*/g, '\u3000') // Replace rest of asterisks with spaces
        msgArrows = starCount ? '\u3000' + msgArrows : msgArrows
        return msgArrows + msg.slice(starCount)
      },
      clearRunScreen() {
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
