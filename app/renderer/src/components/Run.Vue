<template>
  <div>
  <section>
    <h2 class="title">Verify and Run</h2>
    <div class="instructions">Run screen instructions.</div>
      <div class="step step-run">
        <div class="run-info">

          <!-- <div class="current-command">Current Command Here</div> -->
          <div class="progress" v-bind:style="{ width: runPercent + '%' }">{{ runString }}({{runPercent - 20}}%)</div>
        </div>
        <!-- We will need to update store to have the current run state to toggle appropriate buttons, the run-state does nothing for now-->
        <div class="run-modal">
          <button class="run-controls run" @click="runProtocol()">Run</button>
          <button class="run-controls pause" @click="pauseProtocol()">Pause</button>
          <button class="run-controls resume" @click="resumeProtocol()">Resume</button>
        </div>

      </div>
    </section>
  </div>
</template>

<script>
  export default {
    name: "Placeable",
    methods: {
      runProtocol(){
        this.$store.dispatch("runProtocol")
      },
      pauseProtocol(){
        this.$store.dispatch("pauseProtocol")
      },
      resumeProtocol(){
        this.$store.dispatch("resumeProtocol")
      },
    },
    computed: {
      runState() {
        return this.$store.state.run_state
      },
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
