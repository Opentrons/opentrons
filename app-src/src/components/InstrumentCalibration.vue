<template>
  <div class="instrument-calibration" >
    <button @click="calibrateInstrument(instrument.axis, position)" class='btn-calibrate save'>SAVE {{position | prettify}}</button>
    <button @click="moveToPlungerPosition(instrument.axis, position)" :class="[{'disabled': !instrument.calibrated}, 'btn-calibrate', 'move-to']">MOVE TO {{position | prettify}}</button>
    <p>Current Max Volume: {{instrument.max_volume}} <router-link :to="'/volume/' + instrument.axis">Calibrate Volume</router-link></p>
    
  </div>
</template>

<script>
  import { trackEvent } from '../analytics'

  export default {
    name: 'InstrumentCalibration',
    props: ['instrument', 'position'],
    data () {
      return {

      }
    },
    filters: {
      prettify: function (value) {
        if (!value) return ''
        value = value.toString()
        return value.replace('_', ' ')
      }
    },
    methods: {
      calibrateInstrument (axis, position) {
        this.$store.dispatch('calibrate', {axis, position})
        function instrumentsCalibrated () {
          // TODO: Add a condition in the state that tracks if deck is calibrated
          if (!this.$store.state.tasks || this.$store.state.tasks.length === 0) return false
          let pipettesCalibrated = this.$store.state.tasks.instruments.every((plunger) => {
            return plunger.calibrated
          })
          return pipettesCalibrated
        }
        if (instrumentsCalibrated.bind(this)()) {
          trackEvent('INSTRUMENTS_CALIBRATED')
        }
      },
      moveToPlungerPosition (axis, position) {
        this.$store.dispatch('moveToPosition', {axis, position})
      }
    }
  }
</script>