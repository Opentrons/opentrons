<template>
  <div class="move">
    <h3 class="title">Jog X-Y-Z</h3>
    <div class="jog">
      <button @click="jog('y', 1)" class="btn-full btn-y">Y</button>
      <button @click="jog('z', 1)" class="btn-full btn-z">Z</button>
      <button @click="jog('x', -1)" class="btn-full x">X</button>
      <button @click="jog('x', 1)" class="btn-full btn-x">X</button>
      <button @click="jog('y', -1)" class="btn-full btn-y">Y</button>
      <button @click="jog('z', -1)" class="btn-full btn-z">Z</button>
    </div>
    <h3 class="title">Select Increment [mm]</h3>
    <div class="increment" >
      <increment :increments="placeable_increments" :placeable="placeable"></increment>
      <increment :increments="slot_increments" :placeable="placeable"></increment>
    </div>
    <h3 class="title">Move to Slot</h3>
    <div class="deck">
      <DeckSlot :slots="slots" :axis="instrument"></DeckSlot>
    </div>
  </div>
</template>

<script>
import Increment from './Increment.vue'
import DeckSlot from './DeckSlot.vue'

export default {
  name: 'Jog',
  props: ['instrument'],
  data: function(){
    return {
      placeable_increments: [20,10,5,1,0.5,0.1],
      slot_increments: [91,135],
      placeable: true,
      slots: ['A3','B3','C3','D3','E3',
              'A2','B2','C2','D2','E2',
              'A1','B1','C1','D1','E1'],
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
          console.log("x")
          coords.x = increment
          break;
        case "y":
          console.log("y")
          coords.y = increment
          break;
        case "z":
          console.log("z")
          coords.z = increment
          break;
      }
      this.$store.dispatch("jog", coords)
    }
  }

}
</script>
