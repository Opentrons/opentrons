<template>
  <div id="app">
    <div class="nav-full-dark">
      <header class="brand">
        <nav class="links">
          <ul>
            <li>Logo</li>
          </ul>
        </nav>
      </header>
    </div>
    <div class="nav-full-light">
      <header class="controls">
        <nav class="home">
          <span class="label">HOME: </span>
          <span @click="home('x')" class="btn-home">X</span>
          <span @click="home('y')" class="btn-home">Y</span>
          <span @click="home('z')" class="btn-home">Z</span>
          <span @click="home('a')" class="btn-home">A</span>
          <span @click="home('b')" class="btn-home">B</span>
          <span @click="home('all')" class="btn-home">ALL</span>
        </nav>
        <nav class="tabs">
          <a href="#" class="tab active">Protocol</a>
          <a href="#" class="tab">Debug</a>
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
  import {StepList, Upload} from './export'

  export default {
    data () {
      return {
        message: 'Opentrons App'
      }
    },
    methods: {
      home(axis) {
        this.$http
            .get(`/home/${axis}`)
            .then((response) => {
                console.log(response)
                console.log(`Homing ${axis}`)
            }, (response) => {
                console.log('failed to home', response)
            })
      }
    }
  }
</script>

<style lang="sass">
  @import "../assets/sass/main.scss"
</style>
