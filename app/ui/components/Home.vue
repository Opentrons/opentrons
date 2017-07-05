<template>
  <nav class='home' :class="{'disabled': busy}">
    <span class='label'>HOME: </span>
    <span @click='home("all")' class='btn-home' id="home-all">ALL</span>
    <span @click='home("x")' class='btn-home' id="home-x">X</span>
    <span @click='home("y")' class='btn-home' id="home-y">Y</span>
    <span @click='home("z")' class='btn-home' id="home-z">Z</span>
    <span @click='home("b")' class='btn-home' id="home-b">B</span>
    <span @click='home("a")' class='btn-home' id="home-a">A</span>
  </nav>
</template>

<script>
  import { trackEvent } from '../analytics'

  export default {
    name: 'Home',
    props: ['busy'],
    methods: {
      home (axis) {
        this.$store.dispatch('home', {axis: axis})
        trackEvent('home-' + axis)
      }
    }
  }
</script>
