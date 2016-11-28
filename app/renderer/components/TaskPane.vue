<template>
  <span>
    <section id='task-pane' v-show='!running'>
      <aside id='step-list'>
        <StepList></StepList>
      </aside>
      <router-view :class="{'disabled': busy}"></router-view>
    </section>
    <RunScreen v-show='running'></RunScreen>
  </span>
</template>

<script>
  import StepList from './StepList.vue'
  import RunScreen from './RunScreen.vue'

  export default {
    props: ['busy'],
    components: {
      StepList,
      RunScreen
    },
    computed: {
      running () {
        return this.$store.state.running || this.$store.state.protocolFinished
      }
    }
  }
</script>
