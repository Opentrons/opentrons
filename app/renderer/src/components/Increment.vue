<template>
  <span>
    <button v-for="i in increments" @click="selectPlaceableIncrement(i)" :class="['btn-full btn-group', { 'active': active(i)} , { 'btn-slot': isSlot(i)}  ]">{{i}}</button>
    <!-- <button @click="selectPlaceableIncrement(91)" :class="['btn-slot', { 'active': active(91)}]">&#8596; slot-x </button>
    <button @click="selectPlaceableIncrement(135)" :class="['btn-slot', { 'active': active(135)}]">&#8597; slot-y </button> -->
  </span>
</template>

<script>
export default {
  name: 'Increment',
  props: ['increments'],
  methods: {
    active(i) {
      return this.$store.state.current_increment_placeable === i
    },
    isSlot(i) {
      return i === 91 || i === 135
    },
    selectPlaceableIncrement(i){
      this.$store.dispatch("selectPlaceableIncrement", i)
    }
  }
}
</script>