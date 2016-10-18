<template>

  <div>
      <h2 class="title">Calibrate {{ $route.params.instrument }} pipette</h2>
        <div class="instructions">Calibrate {{ calibration.label }}'s plunger. Be sure to save top, bottom, blowout, and droptip. Enter max volume.</div>
  
    <section>

    <div class="step step-calibrate">       
          <div>
           <!--  Current calibration:
            <br>
            <pre>{{ JSON.stringify(calibration, null, 4) }}</pre> -->
            <jog></jog>
          </div>
      </div>

      <navigation :prev="prev" :next="next"></navigation>
    </section>

  </div>

</template>

<script>
  import Navigation from './Navigation.vue'
  import Jog from './Jog.vue'

  export default {
    name: "Instrument",
    components: {
      Navigation,
      Jog
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
      calibrated() {
        // if calibration.values.all != "null" {
        //   this.$store.tasks.instrument.completed = true
        // }
        return "nothing, for now"
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
