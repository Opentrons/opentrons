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
    </div>
  </div>
</template>

<script>
import Increment from './Increment.vue'
export default {
  name: 'Jog',
  data: function(){
    return {
      placeable_increments: [20,10,5,1,0.5,0.1],
      slot_increments: [91,135],
      placeable: true
    }
  },
  components: {
    Increment
  },
  methods: {
    jog(axis, multiplier) {
      let increment = this.$store.state.current_increment_placeable
      increment *= multiplier
      let coords = {}
      switch(axis) {
        case "x":
          coords.x = inc
        case "y":
          coords.y = inc
        case "z":
          coords.z = inc
      }
      this.$store.dispatch("jog", coords)
    }
  }

}
</script>
