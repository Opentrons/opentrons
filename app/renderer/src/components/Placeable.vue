<template>
  <div class="step step-calibrate">
    <div>
      Calibrate {{ $route.params.instrument }}
      to well A1 of {{ $route.params.placeable }}
      Current calibration
      <br>
      <pre>{{ JSON.stringify(calibration[0], null, 4) }}</pre>
      <jog></jog>
    </div>

  </div>
</template>

<script>
import Navigation from './Navigation.vue'
import Jog from './Jog.vue'

  export default {
    name: "Placeable",
    components: {
    Navigation,
    Jog
    },
    methods: {
      currentInstrument(tasks) {
        return tasks.filter((instrument) => {
          return instrument.axis == this.$route.params.instrument
        })
      },
      currentPlaceable(instrument) {
        return instrument[0].placeables.filter((placeable) => {
          return placeable.label ==  this.$route.params.placeable
        })
      }
    },
    computed: {
      calibration() {
        let tasks = this.$store.state.tasks
        let instrument = this.currentInstrument(tasks)
        let placeable = this.currentPlaceable(instrument)
        return placeable
      }
    }
  }
</script>
