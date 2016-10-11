<template>
  <section>
    <h2 class="title">Connect to Robot</h2>
      <div class="instructions">
          Please make sure that your computer is connected to the robot, and your machine is plugged in and turned on before continuing.
      </div>
      <div class="step step-connect">
        <div class="connect" v-if="!connected">
          <select v-model="ports.selected" >
            <option v-for="option in ports.options" v-bind:value="option.value">
              {{ option.text }}
            </option>
          </select>
          <button @click="connectToRobot" v-show="ports.selected" class="btn-connect">Connect!</button>
        </div>
        <div class="connected" v-if="connected">
          <h1 >The selected port is: {{ port }}</h1>
          <button @click="disconnectRobot" v-show="connected" class="btn-connect">Disconnect!</button>
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
    data: function () {
      return {
          ports: {
              selected: null,
              options: []
          }
      }
    },
    computed: {
      connected () {
        return this.$store.state.is_connected;
      },
      port () {
        return this.$store.state.port;
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
                        self.ports.selected = null
                        self.ports.options = ports.map((port) => ({text: port, value: port}))
                        self.ports.options[0].value = null
                    }, (response) => {
                        console.log('failed to get serial ports list', response)
                    })
        },
      connectToRobot: function() {
        this.$store.dispatch('connect_robot', this.ports.selected)
      },
      disconnectRobot: function() {
        this.$store.dispatch('disconnect_robot')
      }
    },
    beforeMount: function () {
        this.getPortsList();
    }
  }
</script>

<style lang="sass">
</style>
