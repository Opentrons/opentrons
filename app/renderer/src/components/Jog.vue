<template>
  <aside id="jog">
    <h2 class="title">Pipette Jog</h2>
    <hr>
    <section id="jog-controls-pipette" :class="{'disabled': busy}">
      <span class="xy">
        <h3 class="title">[X-Y]</h3>
        <button @click="jog('y', 1)" class="btn y up">&uarr;</button>
        <button @click="jog('x', -1)" class="btn x left">&larr;</button>
        <button @click="jog('y', -1)" class="btn y down">&darr;</button>
        <button @click="jog('x', 1)" class="btn x right">&rarr;</button>
      </span>
      <span class="z">
      <h3 class="title">[Z]</h3>
        <button @click="jog('z', -1)" class="btn z up">&uarr;</button>
        <button @click="jog('z', 1)" class="btn z down">&darr;</button>
      </span>

      <span class="increment">
      <Increment :increments="placeable_increments"></Increment>
      </span>
      </section>

    <h2 class="title">Plunger Jog</h2>
    <hr>
     <section id="jog-controls-plunger" :class="{'disabled': busy}">
      <span class="p">
      <h3 class="title">[P]</h3>
        <button @click="jog(currentAxis(), -1)"class="btn p up">&uarr;</button>
        <button @click="jog(currentAxis(), 1)" class="btn p down">&darr;</button>
      </span>
       <span class="increment-plunger">
        <IncrementPlunger :increments="plunger_increments"></IncrementPlunger>
      </span>
      </section>
    </section>

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
        placeable_increments: ["Slot",20,5,1,0.5,0.1],
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
        let increment_plunger = this.$store.state.current_increment_plunger
        increment_plunger *=multiplier
        let coords = {}
        switch(axis) {
          case "x":
            if (increment === 'Slot'){
              increment = 91
            }
            increment *= multiplier
            coords.x = increment
            break;
          case "y":
            if (increment === 'Slot'){
              increment = 135
            }
            increment *= multiplier
            coords.y = increment
            break;
          case "z":
            if (increment === 'Slot'){
              increment = 1
            }
            increment *= multiplier
            coords.z = increment
            break;
          case "a":
            coords.a = increment_plunger
            break;
          case "b":
            coords.b = increment_plunger
            break;
        }
        this.$store.dispatch("jog", coords)
      },
      currentAxis() {
        return this.$route.params.instrument || "b"
      },
      handleJogEvent(e) {
        if (e.key === "ArrowLeft") {
          return this.jog('x', -1)
        } else if (e.key === "ArrowRight") {
          return this.jog('x', 1)
        } else if (e.key === "ArrowDown") {
          if (e.shiftKey) return this.jog('z', 1)
          return this.jog('y', -1)
        } else if (e.key === "ArrowUp") {
          if (e.shiftKey) return this.jog('z', -1)
          return this.jog('y', 1)
        }
      }
    },
    created: function () {
      window.addEventListener('keyup', this.handleJogEvent)
    },
  }
</script>
