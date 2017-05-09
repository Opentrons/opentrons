<template>
  <div id='run' :class="{'disabled': !calibrated}">
    <button v-show='!running' @click='runDetached()' class='btn-run' :class="{ greyOut: !connected }" id="run-job">Run Detached</button>
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
      runDetached () {
        this.$store.dispatch('runDetached')
      },
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

        let placeableCalibrated = this.$store.state.tasks.deck.every((placeable) => {
          placeable.instruments.every((instrument) => {
            return instrument.calibrated
          })
        })
        let instrumentCalibrated = this.$store.state.tasks.instruments.every((instrument) => {
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
