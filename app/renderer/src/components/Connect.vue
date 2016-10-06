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
  </div>
</template>


<script>
  export default {
    data:function () {
      return {
          message: "Let's connect",
          selected_port: "",
          ports: []
      }
    },
    methods: {
      getPortsList: function () {
        this.ajaxRequest = true
        this.$http.get('localhost:8000/ports/list/', function(data, status, request) {
          console.log('we are getting data...')
        })
      },
      connectToRobot: function() {
          debugger
        this.$http.get(
          'localhost:8000/ports/connect/',
          {port: this.selected_port},
          function (data, status, request) {
            console.log("Tried to connect", data, status, request)
          })
      }
    },
    beforeMount: function () {
        this.ports = ["/dev/tty.usbmodem1421", 'B', 'C']
    }

  }
</script>

<style lang="sass">
</style>
