<template>
  <div>
    <h2 class="title">Calibrate {{ calibration.label }}</h2>
    <div class="instructions">Calibrate the {{ instrument.label }} pipette (axis {{instrument.axis}})
    to well A1 of {{ calibration.label }}.
    </div>

    <section>
      <div class="step step-calibrate">
        <div>
          <Jog :instrument="instrument.axis"></Jog>
        </div>
        <div class="save-deck">
          <h3 class="title">Deck Position</h3>
          <coordinates></coordinates>
          <!-- props - calibration, instrument, placeable type -->
          <h3 class="title">{{ calibration.label }} {{ calibration.slot }} {{ type }}</h3>
          <CalibratePlaceable :placeable="calibration" :type="type" :instrument="instrument"></CalibratePlaceable>
        </div>
      </div>
      <Navigation :prev="prev" :next="next"></Navigation>
    </section>
  </div>
</template>

<script>
  import Navigation from './Navigation.vue'
  import Jog from './Jog.vue'
  import Coordinates from './Coordinates.vue'
  import CalibratePlaceable from './CalibratePlaceable.vue'

  export default {
    name: "Placeable",
    components: {
      Navigation,
      Jog,
      Coordinates,
      CalibratePlaceable
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
      },
      containerType(type){
        if (type === "point"){
          return "point"
        } else if (type.includes("tiprack")){
          return "tiprack"
        }
        else {
          return "default"
        }
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
      type(){
        let tasks = this.$store.state.tasks
        let instrument = this.currentInstrument(tasks)
        let placeable = this.currentPlaceable(instrument)
        let type = this.containerType(placeable.type) 
        return type
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
