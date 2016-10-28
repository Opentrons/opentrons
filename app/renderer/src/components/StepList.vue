<template>
  <ul>
    <li v-for="task in default_tasks">
      <router-link v-bind:to="task.href" :class="{'completed': completed(task)}">
        {{task.title}}
      </router-link>
    </li>
    <li v-for="instrument in tasks">
      <ul>
        <li v-for="placeable in instrument.placeables">
          <router-link v-bind:to="placeable.href" :class="{'completed': placeable.calibrated}" exact>
            {{placeable.label}} [{{placeable.slot}}]
         </router-link>
        </li>
      </ul>
    </li>
    <li v-for="instrument in tasks">
      <ul>
      <li>
        <router-link v-bind:to="instrument.href" :class="{'completed': instrument.calibrated}" exact>
          Calibrate {{instrument.label}}
        </router-link>
      </li>
      </ul>
    </li>
    <li v-for="task in run_tasks">
      <router-link v-bind:to="task.href">
        {{task.title}}
      </router-link>
    </li>
  </ul>
</template>

<script>
  export default {
    name: 'StepList',
    data: function() {
      return {
        default_tasks: [
          {
            title: 'connect to robot',
            completed: false,
            href: '/connect'
          },
          {
            title: 'upload a protocol',
            completed: false,
            href: '/upload'
          }
        ],
        run_tasks: [
          {
            title: 'Verify and Run',
            completed: false,
            href: '/run'
          },
        ]
      }
    },
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
