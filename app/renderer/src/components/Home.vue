<template>
  <nav class="home">
    <span class="label">HOME: </span>
    <span @click="home('x')" :class="['btn-home', busy]">X</span>
    <span @click="home('y')" :class="['btn-home', busy]">Y</span>
    <span @click="home('z')" :class="['btn-home', busy]">Z</span>
    <span @click="home('a')" :class="['btn-home', busy]">A</span>
    <span @click="home('b')" :class="['btn-home', busy]">B</span>
    <span @click="home('all')" :class="['btn-home', busy]">ALL</span>
  </nav>
</template>

<script>
  export default {
    name: "Home",
    methods: {
      home(axis) {
        console.log(axis)
        this.$store.dispatch('home', {axis: axis})
      }
    },
    computed: {
      busy: function () {
        return {
          'disabled': this.$store.state.busy
        }
      }
    }
  }
</script>
