<template>
  <ul>
    <li :class="{'completed': task.completed}" v-for="task in tasks">
      <router-link v-bind:to="task.href">{{task.title}}</router-link>
    </li>
  </ul>
</template>

<script>
  function tasks() {
      return [{
          title: 'connect to robot',
          completed: true,
          href: '/'
      }, {
          title: 'upload a protocol',
          completed: false,
          href: '/upload'
      }, {
          title: 'calibrate instruments',
          completed: false,
          href: '/'
      }, {
          title: 'calibrate pipettes',
          completed: false,
          href: '/'
      }, {
          title: 'review calibration',
          completed: false,
          href: '/'
      }]
  }

  export default {
    name: 'StepList',
    data() {
      return { tasks: tasks() }
    }
  }
</script>
