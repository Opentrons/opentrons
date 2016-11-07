<template>
  <div class="connect">
    <select @change="searchIfNecessary()" v-model="ports.selected" id="connections">
      <option value="default">Select a port</option>
      <!-- <option v-if="connected" value="default">{{port}}</option> -->
      <option value="refresh-list">&#8635 refresh</option>
      <option v-for="option in ports.options" v-bind:value="option.value">
        {{ option.text }}
      </option>
    </select>
  </div>
</template>


<script>
  import OpenTrons from '../rest_api_wrapper'

  export default {
    name: "Connect",
    data: function () {
      return {
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
        console.log(this.ports.selected)
        if ( selected === "refresh-list" || selected === null) {
          this.getPortsList()
          this.ports.selected = "default"
        } else if (selected === "default") {
          this.disconnectRobot()
        } else {
          this.connectToRobot()
        }
      },
      connectToRobot: function() {
        console.log(this.ports.selected)
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
