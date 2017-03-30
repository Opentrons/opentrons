<template>
  <div id='run' :class="{'disabled': !calibrated}">
    <button v-show='!running' @click='runProtocol()' class='btn-run' :class="{ greyOut: !connected }">Run Job</button>
    <button v-show='running'@click='cancelProtocol()' class='btn-clear'>Cancel Job</button>
    <div class='controls'>
      <button v-show='!paused && running' @click='pauseProtocol()' class='btn btn-pause'></button>
      <button v-show='paused && running' @click='resumeProtocol()' class='btn btn-play'></button>
    </div>
  </div>
</template>

<script>
  import { trackEvent } from '../analytics'

  export default {
    name: 'Run',
    methods: {
      runProtocol () {
        this.$store.dispatch('runProtocol')
        trackEvent('run-protocol', {
          'protocol-file': this.$store.state.fileName
        })
      },
      pauseProtocol () {
        this.$store.dispatch('pauseProtocol')
        trackEvent('pause-protocol')
      },
      resumeProtocol () {
        this.$store.dispatch('resumeProtocol')
        trackEvent('resume-protocol')
      },
      cancelProtocol () {
        this.$store.dispatch('cancelProtocol')
        trackEvent('cancel-protocol')
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
