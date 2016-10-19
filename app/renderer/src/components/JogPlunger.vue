<template>
<div class="move-pipette">
  
  <h3 class="title">Jog Plunger</h3>
  <div class="plunger">
      <div class="jog-b">
          <a href="#" class="btn-full btn-ab">P</a>
          <a href="#" class="btn-full btn-ab btn-down">P</a>
      </div>
  </div>
  <div class="increment">
      <increment :increments="plunger_increments" :placeable="placeable"></increment>
  </div>

</div>
<!-- End Move Pipette -->
</template>

<script>
import Increment from './Increment.vue'
export default {
  name: 'JogPlunger',
  data: function(){
    return {
      plunger_increments: [2,1,0.5,0.1],
      placeable: false
    }   
  },
  components: {
    Increment
  },
  computed: {
    current_increment_placeable(){
      return this.$store.state.current_increment_placeable
    }
  }

}
</script>