<template>
  <div id='run' :class="{'disabled': !calibrated}">
    <button v-show='!running' @click='runProtocol()' class='btn-run'>Run Job</button>
    <button v-show='running'@click='cancelProtocol()' class='btn-clear'>Cancel Job</button>
    <div class='controls'>
      <button v-show='!paused && running' @click='pauseProtocol()' class='btn btn-pause'></button>
      <button v-show='paused && running' @click='resumeProtocol()' class='btn btn-play'></button>
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
      paused () {
        return this.$store.state.paused
      },
      calibrated () {
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
