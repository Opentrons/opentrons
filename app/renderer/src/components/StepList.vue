<template>
  <!-- <ul>
    <li v-for="task in default_tasks">
      <router-link v-bind:to="task.href" :class="{'completed': completed(task)}">
        {{task.title}}
      </router-link>
    </li>
    <li v-for="instrument in tasks">
      <ul>
        <li v-for="placeable in instrument.placeables">
          <router-link v-bind:to="placeable.href" :class="{'completed': placeable.calibrated}" exact>
            <span class="clip">{{placeable.label}} [{{placeable.slot}}]<span class="clip">
         </router-link>
        </li>
      </ul>
    </li>
    <li v-for="instrument in tasks">
      <ul>
      <li>
        <router-link v-bind:to="instrument.href" :class="{'completed': instrument.calibrated}"  exact>
          <span class="clip">calibrate {{instrument.label}}</span>
        </router-link>
      </li>
      </ul>
    </li>
    <li v-for="task in run_tasks" v-show="tasks.length > 0">
      <router-link v-bind:to="task.href">
        {{task.title}}
      </router-link>
    </li>
  </ul> -->
  <div class="instrument">
    <h3 class="title">p200</h3>
    <ul>
      <li><a class="completed">[A1] tiprack200</a></li>
      <li><a class="router-link-active">[B2] trash</a></li>
      <li><a>[C1] plate</a></li>
      <li><a>[C2] tuberack</a></li>
      <li><a>Pipette</a></li>
    </ul>
    </div>
    <div class="instrument">
      <h3 class="title">p10</h3>
      <ul>
        <li><a>[A1] tiprack10</a></li>
        <li><a>[B2] trash</a></li>
        <li><a>[C1] plate</a></li>
        <li><a>[C2] tuberack</a></li>
        <li><a>Pipette</a></li>
      </ul>
    </div>
  </div>
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
