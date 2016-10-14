<template>
  <div>
    Calibrate {{ $route.params.pipette }}
    to well A1 of {{ $route.params.container }}
    {{calibration}}
  </div>
</template>

<script>
  export default {
    name: "Container",
    methods: {
      currentInstrument(tasks) {
        return tasks.filter((instrument) => {
          console.log(instrument)
          return instrument.axis == this.$route.params.pipette
        })
      },
      currentContainer(instrument) {
        return instrument[0].placeables.filter((container) => {
          return container.label ==  this.$route.params.container
        })
      }
    },
    computed: {
      calibration() {
        let tasks = this.$store.state.tasks
        let instrument = this.currentInstrument(tasks)
        let container = this.currentContainer(instrument)
        return container
      }
    }
  }
</script>
