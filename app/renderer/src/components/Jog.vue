<template>
  <aside id="jog">
    <h2 class="title" id="xy">Jog [XY]</h2>
    <h2 class="title" id="z">Jog [Z]</h2>
    <h2 class="title" id="p">Plunger</h2>
    <hr>
    <section id="jog-controls">
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
        <button class="btn p up">&uarr;</button>
        <button class="btn p down">&darr;</button>
      </span>
    </section>
    <h2 class="title">Select Increment [mm]</h2>
    <hr>
    <Increment :increments="placeable_increments"><Increment>
    <h2 class="title">Move to Slot</h2>
    <hr>
    <DeckSlot :slots="slots"></DeckSlot>
  </aside>
</template>

<script>
  import DeckSlot from './DeckSlot.vue'
  import Increment from './Increment.vue'

  export default {
    name: 'Jog',
    props: ['instrument', 'disabled'],
    data: function () {
      return {
        placeable_increments: [50, 20,10,1,0.5,0.1, "SLOT"],
        placeable: true,
        slots: ['A3','B3','C3','D3','E3',
                'A2','B2','C2','D2','E2',
                'A1','B1','C1','D1','E1']
      }
    },
    components: {
      Increment,
      DeckSlot
    },
    methods: {
      jog(axis, multiplier) {
        let increment = this.$store.state.current_increment_placeable
        increment *= multiplier
        var coords = {}
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
        }
        this.$store.dispatch("jog", coords)
      }
    }
  }
</script>
