<template>
  <section>
    <h2 class="title">Connect to Robot</h2>
      <div class="instructions">
          Please make sure that your computer is connected to the robot, and your machine is plugged in and turned on before continuing.
      </div>
      <div class="step step-connect">
      <div class="connect">
          <select v-model="ports.selected" v-show="!connected">
            <option v-for="option in ports.options" v-bind:value="option.value">
              {{ option.text }}
            </option>
          </select>
      <span v-show="connected">The selected port is: {{ports.selected}}</span>
      <button @click="connectToRobot" v-if="ports.selected"class="btn-connect">Connect!</button>
      </div>
    </div>
    <!-- TODO: Add component for navigation (especially next) -->
    <nav>
        <a href="#" class="prev first">Prev</a>
        <!-- <a href="#info" class="help">?</a> -->
        <a href="#" class="next" v-show="connected">Next</a>
    </nav>
    <!-- End Nav Component -->
  </section>
</template>


<script>
  export default {
    data:function () {
      return {
          message: "Let's connect",
          connected: false,
          ports: {}
      }
    },
    methods: {
      getPortsList: function () {
        this.ports = {
                      selected: null,
                        options: [
                          { text: 'Select a Port', value: null },
                          { text: '/dev/tty.usbmodem1421', value: '/dev/tty.usbmodem1421' },
                          { text: '/dev/tty.usbmodem1421', value: '/dev/tty.usbmodem1421' }
                        ]
                      }
      },

      //        this.ajaxRequest = true
//        this.$http.get('localhost:8000/robot/ports/', function(data, status, request) {
//          console.log('we are getting data...')
//        })
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
