<template>
  <div>
    <toast position="n"></toast>
    <header id="home-connect">
      <Home :busy="robotBusy"></Home>
      <div class="logo">
        <img src="../assets/img/logo_rgb_transparent.png" />
        <span>v{{version}}</span>
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
      <Jog :busy="robotBusy"></Jog>
      <TaskPane :busy="robotBusy">
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
  // import electron from 'electron'

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
      robotBusy() {
        if(!this.$store.state.is_connected) return true
        return this.$store.state.busy
      },
      version() {
        // electron.remote.app.getVersion()
      }
    }
  }
</script>

<style lang="sass">
  @import "../assets/sass/new.scss";
  @import "../../../../node_modules/vuex-toast/dist/vuex-toast.css";
</style>
