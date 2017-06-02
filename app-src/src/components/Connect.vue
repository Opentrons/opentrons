<template>
  <nav class='connect'>
    <div id='indicator' :class="{'connected': connected}"></div>
    <button v-if="!isAuthenticated" id="login" @click='login()' class='btn-run' :class="btn-run">Login</button>
    <button v-else id="logout" @click='logout()' class='btn-run' :class="btn-run">Logout</button>
  </nav>
</template>


<script>
  // import config from 'src/config'
  // import * as types from 'src/store/mutation-types'

  export default {
    name: 'Connect',
    computed: {
      isAuthenticated () {
        return this.$store.state.isAuthenticated
      },
      connected () {
        return !!this.$store.state.connectedRobot
      }
    },
    mounted () {
      // Note: commented out to troubleshoot delays in jog
      // Keep pinging the robot
      // var that = this
      // window.setInterval(
      //   () => {
      //    that.$http
      //      .get(`http://${that.$store.state.selectedRobot}/robot/versions`)
      //      .then((response) => {
      //        that.$store.state.connectedRobot ||
      //        that.$store.commit(types.UPDATE_ROBOT_CONNECTION, that.$store.state.selectedRobot)
      //        console.log(`Connected to ot-two: ${response}`)
      //      }, (response) => {
      //        !that.$store.state.connectedRobot ||
      //        that.$store.commit(types.UPDATE_ROBOT_CONNECTION, '')
      //        console.log(`Failed to connect to ot-two: ${response}`)
      //      })
      //  },
      //  config.NETWORK_SCAN_TIMEOUT
      // )
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
