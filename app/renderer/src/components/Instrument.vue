<template>
  <div>
    <h2 class="title">Calibrate {{ calibration.label }} pipette</h2>
    <div class="instructions">
      Calibrate {{ calibration.label }}'s plunger. Be sure to save top, bottom, blowout, and droptip. Enter max volume.
    </div>

    <section>
      <div class="step step-calibrate">
        <Jog :instrument="calibration.axis"></Jog>
        <JogPlunger :axis="calibration.axis"></JogPlunger>
        <div class="save-pipette">
            <h3 class="title">Current Position</h3>
            <coordinates :instrument="instrument" :axis="calibration.axis.toUpperCase()"></coordinates>
        </div>
      </div>
      <Navigation :prev="prev" :next="next"></Navigation>
    </section>
  </div>
</template>

<script>
  import Navigation from './Navigation.vue'
  import Jog from './Jog.vue'
  import JogPlunger from './JogPlunger.vue'
  import Coordinates from './Coordinates.vue'

  export default {
    name: "Instrument",
    data: function() {
      return {
        instrument: true
      }
    },
    components: {
      Navigation,
      Jog,
      JogPlunger,
      Coordinates
    },
    methods: {
      currentInstrument(tasks) {
        return tasks.filter((instrument) => {
          return instrument.axis == this.$route.params.instrument
        })[0]
      }
    },
    computed: {
      calibration() {
        let tasks = this.$store.state.tasks
        let instrument = this.currentInstrument(tasks)
        return instrument
      },
      next() {
        let tasks = this.$store.state.tasks
        let instrument = this.currentInstrument(tasks)
        let currentInstrumentIndex = tasks.indexOf(instrument)
        let nextInstrument = tasks[currentInstrumentIndex + 1]
        if(nextInstrument) {
          return nextInstrument.href
        } else {
          return '/run'
        }
      },
      prev() {
        let tasks = this.$store.state.tasks
        let instrument = this.currentInstrument(tasks)
        let currentInstrumentIndex = tasks.indexOf(instrument)
        let prevInstrument = tasks[currentInstrumentIndex - 1]
        let prevPlaceables = tasks[tasks.length - 1].placeables
        let prevPlaceable = prevPlaceables[prevPlaceables.length - 1]

        if(prevInstrument) {
          return prevInstrument.href
        } else {
          return prevPlaceable.href
        }
      }
    }
  }
</script>
