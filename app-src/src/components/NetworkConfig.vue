<template>
	<nav>
		<button id='network-config-open-btn' @click='toggleNetworkPanel()' class='btn-run'>Configure Network</button>
		<div class="network-config-content" v-show="showNetworkPanel">
			<div class="available-network-container" v-for="network in availableNetworks">
				<div class="available-network" @click="networkFocus(network.name)">
					<h3 class="network-config-network-label">{{ network.name }}</h3>
					<div class="network-config-credentials" v-show="networkInFocus == network.name">
						<span class="password-label" v-show="network.is_encrypted">Password: </span><input type="text" name="password" v-model="passkey" v-show="network.is_encrypted"><br>
						<button class='btn-run' @click="sendWifiCredentials(network.name, passkey)">Connect</button>
					</div>
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
        passkey: null,
        networkInFocus: '',
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
      toggleNetworkPanel: function () {
        this.showNetworkPanel = !this.showNetworkPanel
        if (this.showNetworkPanel) {
          this.$http
            .get(`http://${this.$store.state.selectedRobot}/wifi/get_networks`)
            .then(function (response) {
              this.availableNetworks = response.body.networks
            }, (response) => {
              this.$store.commit(types.UPDATE_ROBOT_CONNECTION, '')
              console.log(`Failed to connect to ot-two: ${response}`)
            })
        }
      },
      sendWifiCredentials: function (ssid, passkey) {
        this.$store.dispatch('sendWifiCredentials', [ssid, passkey])
      },
      logout: function () {
        this.$router.push('/logout')
      },
      networkFocus: function (networkName) {
        if (this.networkInFocus !== networkName) {
          this.passkey = ''
          this.networkInFocus = networkName
        }
      }
    }
}
</script>



<style lang='sass'>
  @import "../assets/sass/components/networkConfig.scss";
</style>



