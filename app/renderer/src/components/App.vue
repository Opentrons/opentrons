<template>
  <div>
    <toast position="n"></toast>
    <header id="home-connect">
      <Home :busy="robot_busy"></Home>
      <div class="logo">
        <img src="../assets/img/logo_rgb_transparent.png" />
      </div>
      <nav class="connect">
        <Connect></Connect>
      </nav>
    </header>
    <section class="protocol">
      <Upload></Upload>
      <Protocol></Protocol>
      <ProgressBar></ProgressBar>
      <Run></Run>
    </section>
    <main id="container">
      <Jog :busy="robot_busy"></Jog>
      <TaskPane :busy="robot_busy">
    </main>
  <div>
</template>


<script>
  import Connect from './Connect.vue'
  import Home from './Home.vue'
  import Jog from './Jog.vue'
  import Upload from './Upload.vue'
  import TaskPane from './TaskPane.vue'
  import Run from './Run.vue'
  import Protocol from './Protocol.vue'
  import ProgressBar from './ProgressBar.vue'
  import { Toast } from 'vuex-toast'

  export default {
    components: {
      Toast,
      Connect,
      Home,
      Jog,
      Upload,
      TaskPane,
      Run,
      Protocol,
      ProgressBar
    },
    computed: {
      robot_busy() {
        return this.$store.state.busy
      }
    }
  }
</script>

<style lang="sass">
  @import "../assets/sass/new.scss";
  @import "../../../../node_modules/vuex-toast/dist/vuex-toast.css";
</style>
