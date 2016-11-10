<template>
  <div id="run" :class="{'disabled': !calibrated}">
    <button @click="runProtocol()" class='btn-run'>Run Job</button>
    <div class="controls">
      <button @click="pauseProtocol()" class="btn btn-pause"></button>
      <button @click="resumeProtocol()" class="btn btn-play"></button>
      <button @click="cancelProtocol()" class="btn btn-clear"></button>
    </div>
  </div>
</template>

<script>
  export default {
    name: "Run",
    methods: {
      runProtocol() {
        this.$store.dispatch("running")
        this.$store.dispatch("runProtocol")
      },
      pauseProtocol() {
        this.$store.dispatch("pauseProtocol")
      },
      resumeProtocol() {
        this.$store.dispatch("resumeProtocol")
      },
      cancelProtocol() {
        this.$store.dispatch("cancelProtocol")
      }
    },
    computed: {
      runState() {
        return this.$store.state.run_state
      },
      calibrated() {
        if(!this.$store.state.is_connected) return false
        if(this.$store.state.tasks.length == 0) return false

        return this.$store.state.tasks.every((instrument) => {
          let placeableCalibrated = instrument.placeables.every((placeable) => {
            return placeable.calibrated
          })
          return instrument.calibrated && placeableCalibrated
        })
      }
    }
  }
</script>
