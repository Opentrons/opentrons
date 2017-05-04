<template>
  <span>
    <section id='task-pane' v-show='!running()'>
    <router-view></router-view>
        </section>
        <RunScreen class='run-screen' v-show='running()'></RunScreen>
      </span>
</template>

<script>
  import RunScreen from './RunScreen.vue'

  export default {
    name: 'TaskPane',
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
