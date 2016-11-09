<template>
  <section id="task-pane">
    <aside id="step-list">
      <StepList></StepList>
    </aside>
    <router-view :class="{'disabled': busy}"></router-view>
  </section>
</template>

<script>
  import StepList from './StepList.vue'

  export default {
    props: ["busy"],
    components: {
      StepList
    }
  }
</script>
