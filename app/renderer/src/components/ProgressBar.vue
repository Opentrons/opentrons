<template>
  <div id="progress">
    <span class="title">Progress: </span><span class="info"> {{runPercent}}%</span>
    <div id="progress-bar-total">
      <div :style="percentClass" id="percent-complete"></div>
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
        console.log(finished_tasks_length, all_tasks_length)
        let percent = Math.round((finished_tasks_length / all_tasks_length) * 100)
        return percent || 0
      },
      percentClass() {
        return `width:${this.runPercent}%;`
      }
    }
  }
</script>
