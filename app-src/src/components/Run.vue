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
        if (!this.$store.state.isConnected) return false
        if (this.$store.state.tasks.length === 0) return false

        let placeableCalibrated = this.$store.state.deck.every((placeable) => {
          placeable.every((instrument) => {
            return instrument.calibrated
          })
        })
        let instrumentCalibrated = this.$store.state.tasks.every((instrument) => {
          return instrument.calibrated
        })
        return placeableCalibrated && instrumentCalibrated
      }
    }
  }
</script>
<style>
  .greyOut {
    background-color: gray;
  }
</style>
