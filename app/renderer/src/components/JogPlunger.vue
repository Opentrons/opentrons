<template>
  <div class="move-pipette">
    <h3 class="title">Jog Plunger</h3>
    <div class="plunger">
      <div v-if="axis === 'a'" class="jog-a">
        <a @click="jogPlunger('a', 1)" class="btn-full btn-ab">P</a>
        <a @click="jogPlunger('a', -1)" class="btn-full btn-ab btn-down">P</a>
      </div>
      <div v-else="axis === 'b'" class="jog-b">
        <a @click="jogPlunger('b', 1)" class="btn-full btn-ab">P</a>
        <a @click="jogPlunger('b', -1)" class="btn-full btn-ab btn-down">P</a>
      </div>
    </div>
    <div class="increment">
        <increment :increments="plunger_increments" :placeable="placeable"></increment>
    </div>
  </div>
</template>

<script>
import Increment from './Increment.vue'
export default {
  name: 'JogPlunger',
  props: ['axis'],
  data: function(){
    return {
      plunger_increments: [2,1,0.5,0.1],
      placeable: false
    }
  },
  components: {
    Increment
  },
  methods: {
    jogPlunger(axis, multiplier) {
      let increment = this.$store.state.current_increment_plunger
      increment *= multiplier
      var coords = {}
      if(axis === "a"){
        console.log("a")
        coords.a = increment
      }else{
        console.log("b")
        coords.b = increment
      }
      this.$store.dispatch("jogPlunger", coords)
    }
  }
}

</script>
