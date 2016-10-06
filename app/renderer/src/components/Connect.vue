<template>
  <div>
    <nav class="robot">
      <span>connect to robot</span>
      <br>
       {{ message }}
      <br>
      <select v-model="selected_port">
        <option v-for="p in ports">{{ p }}</option>
      </select>
      the selected port is: {{ selected_port}}

      <br>
      <br>
      <a @click="connectToRobot" class="btn-connect">Connect!</a>
    </nav>
    <!-- TODO: Add component for navigation (especially next) -->
  </div>
</template>


<script>
  export default {
    data:function () {
      return {
          message: "Let's connect",
          connected: false,
          selected_port: "",
          ports: []
      }
    },
    methods: {
      getPortsList: function () {
        this.ports = ["/dev/tty.usbmodem1421", 'B', 'C']

//        this.ajaxRequest = true
//        this.$http.get('localhost:8000/robot/ports/', function(data, status, request) {
//          console.log('we are getting data...')
//        })

      },
      connectToRobot: function() {
        let url = 'localhost:8000/robot/connect/'
        let options = {params: {port: this.selected_port}}
        this.$http.get(url, options, function (data, status, request) {
          // TODO: Parse response from backend and either who connected or not connected
            console.log("Tried to connect", data, status, request)
        })
      }
    },
    beforeMount: function () {
        // TODO: USE AJAX request to list of ports from the backend
        this.getPortsList();
    }
  }
</script>

<style lang="sass">
</style>
