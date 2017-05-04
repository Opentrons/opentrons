<template>
  <div class="instrument-calibration" >
    <button @click="calibrateInstrument(instrument.axis, position)" class='btn-calibrate save'>SAVE</button>
    <button @click="moveToPlungerPosition(instrument.axis, position)" class="btn-calibrate move-to">MOVE TO</button>
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