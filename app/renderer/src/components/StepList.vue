<template>
  <ul>
    <li v-for="task in default_tasks">
      <router-link v-bind:to="task.href">{{task.title}}</router-link>
    </li>
    <span v-for="instrument in tasks">
      <li v-for="placeable in instrument.placeables">
        {{$data.tasks}}
        <router-link v-bind:to="'instrument/' + placeable.label">Calibrate {{placeable.label}}</router-link>
      </li>
    <span/>
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
      }
    }
  }
</script>
