<template>
  <div>
    Calibrate {{ $route.params.instrument }}
    Current calibration (test)
    <br>
    <pre>{{ JSON.stringify(calibration[0]) }}</pre>
  </div>
</template>

<script>
  export default {
    name: "Instrument",
    methods: {
      currentInstrument(tasks) {
        return tasks.filter((instrument) => {
          return instrument.axis == this.$route.params.instrument
        })
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
      }
    }
  }
</script>
