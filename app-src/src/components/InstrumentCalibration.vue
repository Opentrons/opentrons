<template>
  <div class="instrument-calibration" >
    <button @click="calibrateInstrument(instrument.axis, position)" class='btn-calibrate save'>SAVE {{position | prettify}}</button>
    <button @click="moveToPlungerPosition(instrument.axis, position)" :class="[{'disabled': !instrument.calibrated}, 'btn-calibrate', 'move-to']">MOVE TO {{position | prettify}}</button>
  </div>
</template>

<script>
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
      },
      moveToPlungerPosition (axis, position) {
        this.$store.dispatch('moveToPosition', {axis, position})
      }
    }
  }
</script>