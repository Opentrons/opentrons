<template>
  <nav class="home" :class="{'disabled': busy}">
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
    props: ["busy"],
    methods: {
      home(axis) {
        console.log(axis)
        this.$store.dispatch('home', {axis: axis})
      }
    }
  }
</script>
