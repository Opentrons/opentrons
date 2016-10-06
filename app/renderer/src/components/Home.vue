<template>
  <div id="app">
    <div class="nav-full-dark">
      <header class="brand">
        <nav class="links">
          <ul>
            <li>{{ message }}</li>
          </ul>
        </nav>
        <nav class="robot">
          <span>connect to robot</span>
          <input type="text" id="connect_port" value="/dev/tty.usbmodem1421" />
          <a href="#" class="btn-connect" id="connect_serial">Connect Serial</a>
        </nav>
      </header>
    </div>
    <div class="nav-full-light">
      <header class="controls">
        <nav class="home">
          <span class="label">HOME: </span>
          <a href="#" class="btn-home">X</a>
          <a href="#" class="btn-home">Y</a>
          <a href="#" class="btn-home">Z</a>
          <a href="#" class="btn-home">A</a>
          <a href="#" class="btn-home">B</a>
          <a href="#" class="btn-home">ALL</a>
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
        <router-view name="this.$route.params.slug"></router-view>
      </section>
    </div>
  </div>
</template>


<script>
import StepList from './StepList.vue'

export default {
  data () {
    return {
      message: 'wooooah'
    }
  }
}
</script>

<style lang="sass">
  @import "../assets/sass/main.scss"
</style>
