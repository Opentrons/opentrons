<template>
  <section id="console" ref='commands'>
    <div class='runCommand' v-for='command in runLog' :class="command.type">
      {{command.timestamp}} - {{command.command_description}}

    </div>
  </section>
</template>

<script>
  export default {
    name: 'Console',
    computed: {
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

