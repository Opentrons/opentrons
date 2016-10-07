<template>
  <section>
    <h2 class="title">Connect to Robot</h2>
      <div class="instructions">
          Please make sure that your computer is connected to the robot, and your machine is plugged in and turned on before continuing.
      </div>
      <div class="step step-connect">
      <div class="connect">
          <select v-model="selected_port" class="ports">
            <option v-for="p in ports">{{ p }}</option>
          </select>    
       
      <span v-show="connected">The selected port is: {{selected_port}}</span>
      <a @click="connectToRobot" v-show="selected_port"class="btn-connect">Connect!</a>
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
          selected_port: null,
          ports: []
      }
    },
    methods: {
      getPortsList: function () {
        let self = this
        this.ajaxRequest = true
        this.$http
            .get('http://localhost:5000/robot/serial/list')
            .then((response) => {
                console.log(arguments)
                console.log('we are getting data...')
                self.ports = response.data.ports
            }, (response) => {
                console.log('failed to get serial ports list', response)
            })
      },
      connectToRobot: function() {
        let url = 'localhost:5000/robot/serial/connect'
        let options = {params: {port: this.selected_port}}
        let self = this
        this.$http
            .get('http://localhost:5000/robot/serial/list', options)
            .then((response) => {
                console.log(response)
                console.log('successfully connected...')
                self.connected = true
            }, (response) => {
                console.log('failed to connect', response)
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
