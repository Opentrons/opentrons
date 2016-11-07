<template>
  <section id="task-pane">
    <aside id="step-list">
      <StepList></StepList>
    </aside>
    <router-view></router-view>
  </section>
</template>

<script>
  import StepList from './StepList.vue'

  export default {
    components: {
      StepList
    }
  }
</script>
