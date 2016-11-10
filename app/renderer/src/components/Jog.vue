<template>
  <aside id="jog">
    <h2 class="title" id="xy">Jog [XY]</h2>
    <h2 class="title" id="z">Jog [Z]</h2>
    <h2 class="title" id="p">Plunger</h2>
    <hr>
    <section id="jog-controls" :class="{'disabled': busy}">
      <span class="xy">
        <button @click="jog('y', 1)" class="btn y up">&uarr;</button>
        <button @click="jog('x', -1)" class="btn x left">&larr;</button>
        <button @click="jog('y', -1)" class="btn y down">&darr;</button>
        <button @click="jog('x', 1)" class="btn x right">&rarr;</button>
      </span>
      <span class="z">
        <button @click="jog('z', 1)" class="btn z up">&uarr;</button>
        <button @click="jog('z', -1)" class="btn z down">&darr;</button>
      </span>
      <span class="p">
        <button @click="jog(currentAxis(), -1)"class="btn p up">&uarr;</button>
        <button @click="jog(currentAxis(), 1)" class="btn p down">&darr;</button>
      </span>
    </section>

    <h2 class="title">Select Increment [mm]</h2>
    <hr>
    <span class="increment">
    <Increment :increments="placeable_increments"></Increment>
    <IncrementPlunger :increments="plunger_increments"></IncrementPlunger>
    </span>
    <h2 class="title">Move to Slot</h2>
    <hr>
    <DeckSlot :busy="busy"></DeckSlot>
  </aside>
</template>

<script>
  import DeckSlot from './DeckSlot.vue'
  import Increment from './Increment.vue'
  import IncrementPlunger from './IncrementPlunger.vue'

  export default {
    name: 'Jog',
    props: ["busy"],
    data: function () {
      return {
        placeable_increments: [20,5,1,0.5,0.1],
        plunger_increments: [2,1,0.5,0.1]     
      }
    },
    components: {
      Increment,
      IncrementPlunger,
      DeckSlot
    },
    methods: {
      jog(axis, multiplier) {
        let increment = this.$store.state.current_increment_placeable
        let incrementPlunger = this.$store.state.current_increment_plunger
        increment *= multiplier
        incrementPlunger *=multiplier
        let coords = {}
        switch(axis) {
          case "x":
            coords.x = increment
            break;
          case "y":
            coords.y = increment
            break;
          case "z":
            coords.z = increment
            break;
          case "a":
            coords.a = incrementPlunger
            break;
          case "b":
            coords.b = incrementPlunger
            break;
        }
        this.$store.dispatch("jog", coords)
      },
      currentAxis() {
        return this.$route.params.instrument || "b"
      }
    }
  }
</script>
