<template>
  <span>
    <button v-for="i in increments" @click="selectIncrement(i)" :class="['btn-full btn-group', { 'active': active(i)} , { 'btn-slot': isSlot(i)}]" >{{i}}</button>
  </span>
</template>

<script>
  export default {
    name: 'Increment',
    props: ['increments', 'placeable'],
    methods: {
      active(i) {
        if (this.placeable) {
          return this.$store.state.current_increment_placeable === i
        } else {
          return this.$store.state.current_increment_plunger === i
        }
      },
      isSlot(i) {
        return i === 91 || i === 135
      },
      selectIncrement(i) {
        let type = "plunger"
        if (this.placeable) { type = "placeable" }
        this.$store.dispatch("selectIncrement", {inc: i, type: type})
      }
    }
  }
</script>
