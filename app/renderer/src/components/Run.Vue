<template>
  <div id="run">
    <button @click="runProtocol()" class="btn-run">Run Job</button>
    <div class="controls">
      <button @click="pauseProtocol()" class="btn btn-pause"></button>
      <button @click="resumeProtocol()" class="btn btn-play">P</button> 
      <button class="btn btn-clear">X</button>
    </div>
  </div>
</template>

<script>
  export default {
    name: "Run",
    methods: {
      runProtocol(){
        this.$store.dispatch("runProtocol")
      },
      pauseProtocol(){
        this.$store.dispatch("pauseProtocol")
      },
      resumeProtocol(){
        this.$store.dispatch("resumeProtocol")
      },
    },
    computed: {
      runState() {
        return this.$store.state.run_state
      }
    }
  }
</script>
