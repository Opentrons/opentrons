<template>
  <nav class='connect'>
    <NetworkConfig/>
    <div id='indicator' :class="[{'connected' : connected == 'connected'}, {'connected_wireless' : connected == 'connected_wireless'}]"></div>
    <button v-if="!isAuthenticated" id="login" @click='login()' class='btn-run' :class="btn-run">Login</button>
    <button v-else id="logout" @click='logout()' class='btn-run' :class="btn-run">Logout</button>
  </nav>
</template>


<script>
  // import config from 'src/config'
  // import * as types from 'src/store/mutation-types'
  import NetworkConfig from './NetworkConfig'

  export default {
    name: 'Connect',
    components: {
      NetworkConfig
    },
    computed: {
      isAuthenticated () {
        return this.$store.state.isAuthenticated
      },
      connected () {
        return this.$store.state.connectedRobot
      }
    },
    methods: {
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
    }
  }
</script>
