<template>
  <div id="run">
    <button @click="runProtocol()" :class="[{'active': active}, 'btn-run']">Run Job</button>
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
      active() {
        return this.$store.state.tasks.every((instrument) => {
          let placeablesCalibrated = instrument.every((placeable) => {
            return placeable.calibrated
          })
          return instrument.calibrated && placeablesCalibrated
        })
      }
    }
  }
</script>
