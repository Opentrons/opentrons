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
          ports: {
              selected: null,
              options: []
          }
      }
    },
    methods: {
        getPortsList: function () {
            this.ports = {
                selected: null,
                options: [
                    //Schema: { text: '/dev/tty.usbmodem1421', value: '/dev/tty.usbmodem1421' }
                ]
            }
            let self = this
            this.$http
                    .get('http://localhost:5000/robot/serial/list')
                    .then((response) => {
                        console.log('we are getting data...', response.data)
                        let ports = ['Select a port'].concat(response.data.ports)
                        self.ports.selected = ports[0]
                        self.ports.options = ports.map((port) => ({text: port, value: port}))
                    }, (response) => {
                        console.log('failed to get serial ports list', response)
                    })
        },
      connectToRobot: function() {
        let options = {params: {port: this.selected_port}}
        let self = this
        this.$http
            .get('http://localhost:5000/robot/serial/connect', options)
            .then((response) => {
                console.log(response)
                if (response.data.is_connected === true){
                    self.connected = true
                    console.log('successfully connected...')
                } else {
                    console.log('Failed to connect', response.data)
                }
            }, (response) => {
                console.log('Failed to communicate to backend server. Failed to connect', response)
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
