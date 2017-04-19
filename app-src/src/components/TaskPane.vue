<template>
  <span>
    <section id='task-pane' v-show='!running()'>
    <router-view></router-view>
        </section>
        <RunScreen class='run-screen' v-show='running()'></RunScreen>
      </span>
</template>

<script>
  // import StepList from './StepList.vue'
  import RunScreen from './RunScreen.vue'

  export default {
    props: ['busy'],
    components: {
      RunScreen
    },
    methods: {
      running () {
        return this.$store.state.running || this.$store.state.protocolFinished
      }
    }
  }
</script>
