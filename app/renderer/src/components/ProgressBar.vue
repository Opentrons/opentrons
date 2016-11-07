<template>
  <div id="progress">
    <span class="title">Progress: </span><span class="info"> 20%</span>
    <div id="progress-bar-total">
      <div id="percent-complete"></div>
    </div>
  </div>
</template>

<script>
  export default {
    name: "ProgressBar",
    computed: {
      runPercent() {
        let finished_tasks_length = this.$store.state.run_log.length
        let all_tasks_length = this.$store.state.run_plan.length
        let percent = Math.round((finished_tasks_length / all_tasks_length) * 100) + 20
        return percent
      },
      runString() {
        return `${this.$store.state.run_log.length} / ${this.$store.state.run_plan.length}`
      }
    }
  }
</script>
