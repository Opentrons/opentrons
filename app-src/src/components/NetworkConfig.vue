<template>
	<nav>
		<button id='configure_network' @click='config_network()' class='btn-run'>Configure Network</button>

		<div id="myModal" class="modal" v-show="showNetworkPanel">
			<div class="modal-content">
				<span @click='config_network()' class="close">&times;</span>
				<div v-for="network in availableNetworks">
				{{ network.name }}
				<input type="text" name="password" v-model="password" v-show="network.is_encrypted"><br>
				<button @click="sendWifiCredentials(network.name, password)">Connect</button>
				</div>
			</div>

		</div>
<nav>
</template>

<script>
  import NetworkConfig from './NetworkConfig'
  import * as types from 'src/store/mutation-types'

  export default {
    name: 'Connect',
    data: function () {
      return {
        password: null,
        selectedNetwork: null,
        showNetworkPanel: false,
        availableNetworks: {}
      }
    },
    components: {
      NetworkConfig
    },
    computed: {
      connected () {
        return this.$store.state.connectedRobot
      }
    },
    methods: {
      config_network: function () {
        this.showNetworkPanel = !this.showNetworkPanel
        this.$http
          .get(`http://${this.$store.state.selectedRobot}/networks`)
          .then(function (response) {
            this.availableNetworks = response.body.networks
          }, (response) => {
            this.$store.commit(types.UPDATE_ROBOT_CONNECTION, '')
            console.log(`Failed to connect to ot-two: ${response}`)
          })
      },
      sendWifiCredentials: function (ssid, passkey) {
        this.$store.dispatch('connectWifi', ssid, passkey)
      },
      logout: function () {
        this.$router.push('/logout')
      },
      networkCheck: function () {
        console.log(this.value)
      }
    }
}
</script>



<style lang='sass'>
  @import "../assets/sass/components/networkConfig.scss";
</style>



