<template>
  <nav class='home' :class="{'disabled': busy}">
    <span class='label'>HOME: </span>
    <span @click='home("all")' class='btn-home'>ALL</span>
    <span @click='home("x")' class='btn-home'>X</span>
    <span @click='home("y")' class='btn-home'>Y</span>
    <span @click='home("z")' class='btn-home'>Z</span>
    <span @click='home("b")' class='btn-home'>B</span>
    <span @click='home("a")' class='btn-home'>A</span>
  </nav>
</template>

<script>
  export default {
    name: 'Home',
    props: ['busy'],
    methods: {
      home (axis) {
        console.log(axis)
        this.$store.dispatch('home', {axis: axis})
      }
    }
  }
</script>
