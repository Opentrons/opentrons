<template>
  <div>
  <section>
    <h2 class="title">Verify and Run</h2>

    <div class="instructions">Run screen instructions.</div>

      <div class="step step-run">

        <div class="run-info">
          <div class="current-command">Current Command Here</div>
          <div class="progress" v-bind:style="{ width: runPercent + '%' }">{{runPercent}}%</div>   
        </div>
        <!-- We will need to update store to have the current run state to toggle appropriate buttons, the run-state does nothing for now-->
        <div class="run-modal" v-bind:class="runState">
          <button class="run-controls run" @click="runProtocol()">Run</button>
          <button class="run-controls pause" @click="pauseProtocol()">Pause</button>
          <button class="run-controls resume" @click="resumeProtocol()">Resume</button>
        </div>

      </div>
      <!-- <Navigation :prev="prev" :next="next"></Navigation> -->
    </section>
  </div>
</template>

<script>
import Navigation from './Navigation.vue'


export default {
  name: "Placeable",
  components: {
    Navigation
  },
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
    runState(){
      return this.$store.state.run_state
    },
    runPercent(){
      let progress = this.$store.state.progress *100
      return progress
    }
  }
}
</script>
