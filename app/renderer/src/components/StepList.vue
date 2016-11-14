<template>
  <div>
    <span v-for="instrument in tasks">
      <div class="instrument">
        <h3 class="title">[{{instrument.axis}}] {{instrument.label}} <span  v-if="instrument.channels == 1 ">Single</span><span v-else>Multi</span></h3>
        <ul>
          <li v-for="placeable in instrument.placeables">
            <router-link v-bind:to="placeable.href" :class="{'completed': placeable.calibrated}" exact>
            <span class="clip">[{{placeable.slot}}] {{placeable.label}}</span>
           </router-link>
          </li>
          <li>
            <router-link v-bind:to="instrument.href" :class="{'completed': instrument.calibrated}"  exact>
              <span class="clip">[{{instrument.axis}}] {{instrument.label}} <span  v-if="instrument.channels == 1 ">Single</span><span v-else>Multi</span></span>
            </router-link>
          </li>
        </ul>
      </div>
    </span>
  </div>
</template>

<script>
  export default {
    name: 'StepList',
    methods: {
      completed(task) {
        if (task.href === "/upload") {
          return this.$store.state.tasks[0] && !this.$store.state.error
        } else if (task.href === "/connect") {
          return this.$store.state.is_connected
        }
      }
    },
    computed: {
      tasks() {
        return this.$store.state.tasks
      }
    }
  }

</script>
