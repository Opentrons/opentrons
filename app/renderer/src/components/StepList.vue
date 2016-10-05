<template>
  <ul>
    <li :class="{'completed': task.completed}" v-for="task in tasks"><a href="#">{{task.title}}</a></li>
  </ul>
</template>

<script>
  function tasks() {
      return [{
          title: 'connect to robot',
          completed: true
      }, {
          title: 'upload a protocol',
          completed: false
      }, {
          title: 'calibrate instruments',
          completed: false
      }, {
          title: 'calibrate pipettes',
          completed: false
      }, {
          title: 'review calibration',
          completed: false
      }]
  }

  export default {
    name: 'StepList',
    data() {
      return { tasks: tasks() }
    }
  }
</script>
