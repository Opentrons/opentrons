<template>

  
  <div class="increment xyz" >
      <button   v-for="i in placeable_increments" @click="selectPlaceableIncrement(i)" :class="['btn-full btn-group', { 'active': active(i)} ]">{{i}}</button>
  </div>
  


</template>

<script>
export default {
  name: 'Increment',
  computed: {
    placeable_increments(){
      return [20,10,5,1,0.5,0.1]
    },
    pipette_increments(){
      return [5,1,0.5,0.1]
    }
  },
  methods: {
    active(i) {
      return this.$store.state.current_increment_placeable === i
    },
    selectPlaceableIncrement(i){
      this.$store.dispatch("selectPlaceableIncrement", i)
    }
  }
}
</script>