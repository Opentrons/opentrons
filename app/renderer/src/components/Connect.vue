<template>
  <section>
    <h2 class="title">Connect to Robot</h2>
    <div class="instructions">
      Please make sure that your computer is connected to the robot, and your machine is plugged in and turned on before continuing.
    </div>
    <div class="step step-connect">
      <div class="connect" v-if="!connected">
        <select v-model="ports.selected" id="connections" @change="searchIfNecessary()">
          <option value="default">Select a port</option>
          <option value="refresh-list">&#8635 refresh</option>
          <option v-for="option in ports.options" v-bind:value="option.value">
            {{ option.text }}
          </option>
        </select>
        <button @click="connectToRobot" v-show="ports.selected" class="btn-connect">Connect!</button>
      </div>
      <div class="connected" v-if="connected">
        <p>The selected port is: {{ port }}</p>
        <button @click="disconnectRobot" v-show="connected" class="btn-connect">Disconnect!</button>
      </div>
    </div>
    <Navigation :prev="prev" :next="next"></Navigation>
  </section>
</template>


<script>
  import Navigation from './Navigation.vue'
  import OpenTrons from '../rest_api_wrapper'

  export default {
    name: "connect",
    components: {
      Navigation
    },
    data: function () {
      return {
        next: "/upload",
        prev: "/",
        ports: {
          selected: "default",
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
          selected: "default",
          options: []
        }
        OpenTrons.getPortsList().then((ports) => {
          this.ports.options = ports.map((port) => ({text: port, value: port}))
        })
      },
      searchIfNecessary: function () {
        let selected = this.ports.selected
        if ( selected === "refresh-list" || selected === null) {
          this.getPortsList()
          this.ports.selected = "default"
        }
      },
      connectToRobot: function() {
        if (this.ports.selected === 'Refresh') {
          this.ports.selected = null
          return
        }
        this.$store.dispatch('connect_robot', this.ports.selected)
      },
      disconnectRobot: function() {
        this.$store.dispatch('disconnect_robot')
      }
    },
    beforeMount: function() {
      this.getPortsList();
    }
  }
</script>
