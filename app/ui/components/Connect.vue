<template>
  <nav class='connect'>
    <select @change='searchIfNecessary()' v-model='ports.selected' id='connections'>
      <option value='default'>{{defaultOption}}</option>
      <option value='refresh-list'>&#8635 refresh</option>
      <option v-for='option in ports.options' v-bind:value='option.value'>{{ option.text }}</option>
    </select>
    <div id='indicator' :class="{'connected': connected}"></div>
    <button v-if="!isAuthenticated" id="login" @click='login()' class='btn-run'>Login</button>
    <button v-else id="logout" @click='logout()' class='btn-run'>Logout</button>
  </nav>
</template>


<script>
  import Opentrons from 'rest_api_wrapper'

  export default {
    name: 'Connect',
    data: function () {
      return {
        ports: {
          selected: 'default',
          options: []
        }
      }
    },
    computed: {
      isAuthenticated () {
        return this.$store.state.isAuthenticated
      },
      connected () {
        return this.$store.state.isConnected
      },
      port () {
        return this.$store.state.port
      },
      defaultOption () {
        return this.connected ? 'Disconnect' : 'Select a port'
      }
    },
    methods: {
      getPortsList: function () {
        this.ports = {
          selected: 'default',
          options: []
        }
        Opentrons.getPortsList().then((ports) => {
          this.ports.options = ports.map((port) => ({text: port, value: port}))
        })
      },
      searchIfNecessary: function () {
        let selected = this.ports.selected
        if (selected === 'refresh-list' || selected === null) {
          this.getPortsList()
          if (this.$store.state.isConnected) this.ports.selected = this.$store.state.port
        } else if (selected === 'default') {
          this.disconnectRobot()
        } else {
          this.connectToRobot()
        }
      },
      connectToRobot: function () {
        this.$store.dispatch('connectRobot', this.ports.selected)
      },
      disconnectRobot: function () {
        this.$store.dispatch('disconnectRobot')
      },
      login: function () {
        this.$router.push('/login')
      },
      logout: function () {
        this.$router.push('/logout')
      }
    },
    beforeMount: function () {
      this.getPortsList()
    }
  }
</script>
