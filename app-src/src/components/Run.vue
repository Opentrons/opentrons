<template>
  <div id='run' :class="{'disabled': !calibrated}">
    <button v-show='!running' @click='runProtocol()' class='btn-run' :class="{ greyOut: !connected }" id="run-job">Run Job</button>
    <button v-show='running'@click='cancelProtocol()' class='btn-clear' id="cancel-job">Cancel Job</button>
    <div class='controls'>
      <button v-show='!paused && running' @click='pauseProtocol()' class='btn btn-pause' id="pause-job"></button>
      <button v-show='paused && running' @click='resumeProtocol()' class='btn btn-play' id="resume-job"></button>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'Run',
    methods: {
      runProtocol () {
        this.$store.dispatch('runProtocol')
      },
      pauseProtocol () {
        this.$store.dispatch('pauseProtocol')
      },
      resumeProtocol () {
        this.$store.dispatch('resumeProtocol')
      },
      cancelProtocol () {
        this.$store.dispatch('cancelProtocol')
      }
    },
    computed: {
      running () {
        return this.$store.state.running
      },
      connected () {
        return this.$store.state.isConnected
      },
      paused () {
        return this.$store.state.paused
      },
      calibrated () {
        // TODO: Move this to state
        if (!this.$store.state.isConnected) return false
        if (this.$store.state.tasks.length === 0) return false

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
<style>
  .greyOut {
    background-color: gray;
  }
</style>
