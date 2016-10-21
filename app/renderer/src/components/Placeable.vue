<template>
  <div>
    <h2 class="title">Calibrate {{ $route.params.placeable }}</h2>
    <div class="instructions">Calibrate {{ instrument.label }}
    to well A1 of {{ $route.params.placeable }}
    </div>

    <section>
      <div class="step step-calibrate">
        <div>
          <Jog :instrument="instrument.axis"></Jog>
        </div>
      </div>
      <Navigation :prev="prev" :next="next"></Navigation>
    </section>
  </div>
</template>

<script>
  import Navigation from './Navigation.vue'
  import Jog from './Jog.vue'

  export default {
    name: "Placeable",
    data: function() {
      return {
        placeable: true
      }
    },
    components: {
      Navigation,
      Jog
    },
    methods: {
      currentInstrument(tasks) {
        return tasks.filter((instrument) => {
          return instrument.axis == this.$route.params.instrument
        })[0]
      },
      currentPlaceable(instrument) {
        return instrument.placeables.filter((placeable) => {
          return placeable.label ==  this.$route.params.placeable
        })[0]
      }
    },
    computed: {
      calibration() {
        let tasks = this.$store.state.tasks
        let instrument = this.currentInstrument(tasks)
        let placeable = this.currentPlaceable(instrument)
        return placeable
      },
      instrument() {
        let tasks = this.$store.state.tasks
        return this.currentInstrument(tasks)
      },
      next() {
        let tasks = this.$store.state.tasks
        let instrument = this.currentInstrument(tasks)
        let placeable = this.currentPlaceable(instrument)
        let currentIndex = instrument.placeables.indexOf(placeable)

        let nextPlaceable = instrument.placeables[currentIndex + 1]
        let currentInstrumentIndex = tasks.indexOf(instrument)
        let nextInstrument = tasks[currentInstrumentIndex + 1]

        if(nextPlaceable) {
          return instrument.placeables[currentIndex + 1].href
        } else if(!nextPlaceable && nextInstrument) {
          return nextInstrument.placeables[0].href
        } else {
          return tasks[0].href
        }
      },
      prev() {
        let tasks = this.$store.state.tasks
        let instrument = this.currentInstrument(tasks)
        let placeable = this.currentPlaceable(instrument)
        let currentIndex = instrument.placeables.indexOf(placeable)

        let prevPlaceable = instrument.placeables[currentIndex - 1]
        let currentInstrumentIndex = tasks.indexOf(instrument)
        let prevInstrument = tasks[currentInstrumentIndex - 1]

        if(prevPlaceable) {
          return instrument.placeables[currentIndex - 1].href
        } else if(!prevPlaceable && prevInstrument) {
          let prevPlaceables = prevInstrument.placeables
          return prevPlaceables[prevPlaceables.length - 1].href
        } else {
          return '/upload'
        }
      }
    }
  }
</script>
