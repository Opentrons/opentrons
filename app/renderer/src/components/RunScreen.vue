<template>
  <div ref="commands" class="runScreen">
    <span @click="clearRunScreen()" id="exit">X</span>
    <div class="runCommand" v-for="command in runLog">
      {{command["command_description"]}}
      <br>
    </div>
  </div>
</template>

<script>
  export default {
    computed: {
      runLog() {
        return this.$store.state.run_log
      }
    },
    methods: {
      clearRunScreen() {
        this.$store.dispatch("running", false)
      }
    },
    watch: {
      runLog: function(val, oldVal) {
        this.$refs.commands.scrollTop = this.$refs.commands.scrollHeight
      }
    }
  }
</script>
