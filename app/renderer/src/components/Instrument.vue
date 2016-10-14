<template>
  <div>
    Calibrate {{ $route.params.instrument }}
    {{ calibration }}
  </div>
</template>

<script>
  export default {
    name: "Instrument",
    methods: {
      currentInstrument(tasks) {
        return tasks.filter((instrument) => {
          console.log(instrument)
          return instrument.axis == this.$route.params.instrument
        })
      }
    },
    computed: {
      calibration() {
        let tasks = this.$store.state.tasks
        let instrument = this.currentInstrument(tasks)
        return instrument
      }
    }
  }
</script>
