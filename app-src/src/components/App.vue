<template>
  <div>
    <header id='home-connect'>
      <Home :busy='robotBusy'></Home>
      <div class='brand'>
        <div class='logo'>
          <img src='../assets/img/logo_rgb_transparent.png' />
        </div>
        <div class='version'>
          v{{version}}
        </div>
      </div>
      <nav class='connect'>
        <Connect></Connect>
      </nav>
    </header>
    <section class='protocol'>
      <Upload></Upload>
      <Protocol></Protocol>
      <div id='progress'>
        <ProgressBar></ProgressBar>
      </div>
      <Run></Run>
    </section>
    <main id='container'>
      <Jog :busy='robotBusy'></Jog>
      <!-- <TaskView :busy='robotBusy'> -->
      <router-view></router-view>
    </main>
  <div>
</template>


<script>
  import Connect from './Connect.vue'
  import Home from './Home.vue'
  import Jog from './Jog.vue'
  import Upload from './Upload.vue'
  // import TaskView from './TaskView.vue'
  import Run from './Run.vue'
  import Protocol from './Protocol.vue'
  import ProgressBar from './ProgressBar.vue'

  export default {
    components: {
      Connect,
      Home,
      Jog,
      Upload,
      // TaskView,
      Run,
      Protocol,
      ProgressBar
    },
    data: function () {
      return {
        version: '2.?.?'
      }
    },
    computed: {
      robotBusy () {
        if (!this.$store.state.isConnected) return true
        return this.$store.state.busy
      }
    },
    mounted: function () {
      this.$store.dispatch('updateContainers')
      this.$http
        .get('http://localhost:31950/app_version').then((response) => {
          let version = response.body.version
          version ? this.version = version : this.version = '2.?.?'
        })
      window.addEventListener('dragover', function (e) {
        e = e || event
        if (e.target.tagName !== 'INPUT') {
          e.preventDefault()
        }
      }, false)
      window.addEventListener('drop', function (e) {
        e = e || event
        if (e.target.tagName !== 'INPUT') {
          e.preventDefault()
        }
      }, false)
    }
  }
</script>

<style lang='sass'>
  @import "../assets/sass/main.scss";
</style>
