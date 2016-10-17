<template>
  <ul>
    <li v-for="task in default_tasks">
      <router-link v-bind:to="task.href" :class="{'completed': task.completed}">
        {{task.title}}
      </router-link>
    </li>

    <hr v-if="tasks.length > 0">

    <span v-for="instrument in tasks">
      <li v-for="placeable in instrument.placeables">
        <router-link v-bind:to="placeable.href" :class="{'completed': placeable.completed}">
          {{placeable.label}}
       </router-link>
      </li>
    </span>

    <hr v-if="tasks.length > 0">

    <li v-for="instrument in tasks">
      <router-link v-bind:to="instrument.href" :class="{'completed': instrument.completed}">
        Calibrate {{instrument.label}}
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
        ]
      }
    },
    computed: {
      tasks() {
        return this.$store.state.tasks
      },
      completed(task){
        // check if the component is calibrated in the store
        return "nothing, for now"
      }
    }
  }
</script>
