<template>
  <div v-show='running()'>
    <span class='title'>Progress: </span>
    <span class='info'> {{runPercent()}}%</span>
    <div id='progress-bar-total'>
      <div :style='percentClass()' id='percent-complete'></div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'ProgressBar',
    methods: {
      runPercent () {
        let finishedTasksLength = this.$store.state.runLog.filter((command) => {
          return !command.notification
        }).length
        let allTasksLength = this.$store.state.runLength
        let percent = Math.round((finishedTasksLength / allTasksLength) * 100)
        return percent || 0
      },
      percentClass () {
        return `width:${this.runPercent()}%;`
      },
      running () {
        return this.$store.state.running || this.$store.state.protocolFinished
      }
    }
  }
</script>
