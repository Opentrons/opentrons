<template>
  <div id="app">
    <toast position="n"></toast>
    <div class="nav-full-dark">
      <header class="brand">
        <nav class="links">
          <ul>
            <li id="app-title">Logo</li>
          </ul>
        </nav>
      </header>
    </div>
    <div class="nav-full-light">
      <header class="controls">
        <nav class="home">
          <span class="label">HOME: </span>
          <span @click="home('x')" :class="['btn-home', busy]">X</span>
          <span @click="home('y')" :class="['btn-home', busy]">Y</span>
          <span @click="home('z')" :class="['btn-home', busy]">Z</span>
          <span @click="home('a')" :class="['btn-home', busy]">A</span>
          <span @click="home('b')" :class="['btn-home', busy]">B</span>
          <span @click="home('all')" :class="['btn-home', busy]">ALL</span>
        </nav>
        <nav class="tabs">
          <!-- <a href="#" class="tab active">Protocol</a> -->
          <!-- <a href="#" class="tab">Debug</a> -->
        </nav>
      </header>
    </div>
    <div class="wrapper">
      <aside id="step-list">
        <StepList></StepList>
      </aside>
      <section id="task-pane">
        <router-view></router-view>
      </section>
    </div>
  </div>
</template>


<script>
  import { StepList, Upload } from './export'

  export default {
    data () {
      return {
        message: 'Opentrons App'
      }
    },
    methods: {
      home(axis) {
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

<style lang="sass">
  @import "../assets/sass/main.scss";
  @import "../../../../node_modules/vuex-toast/dist/vuex-toast.css";
</style>
