<template>
  <div>
    <toast position="n"></toast>
    <header id="home-connect">
      <Home></Home>
      <div class="logo">
        <img src="../assets/img/logo_rgb_transparent.png" />
      </div>
      <nav class="connect">
        <Connect></Connect>
      </nav>
    </header>
    <section id="protocol">
      <Upload></Upload>
    </section>
    <main id="container">
      <Jog></Jog>
      <TaskPane>
    </main>
    <router-link to="calibrate/p10/test-plate">LINK</router-link>
  <div>
</template>


<script>
  import Connect from './Connect.vue'
  import Home from './Home.vue'
  import Jog from './Jog.vue'
  import Upload from './Upload.vue'
  import TaskPane from './TaskPane.vue'
  import { Toast } from 'vuex-toast'

  export default {
    components: {
      Toast,
      Connect,
      Home,
      Jog,
      Upload,
      TaskPane
    }
  }
</script>

<style lang="sass">
  @import "../assets/sass/new.scss";
  @import "../../../../node_modules/vuex-toast/dist/vuex-toast.css";
</style>
