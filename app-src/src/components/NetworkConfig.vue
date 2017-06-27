<template>
    <nav>
        <button id='network-config-open-btn' @click='toggleNetworkPanel()' class='btn-run'>Configure Network</button>
        <div class="network-config-content" v-show="showNetworkPanel">
            <div class="available-network-container" v-for="(network, index) in availableNetworks">
                <div class="available-network" @click="networkFocus(index)" v-bind:class="[networkInFocusId == index ? 'expanded-network' : 'collapsed-network']">
                    <span class="network-config-network-label">{{ network.name }}</span>
                    <div class="network-config-credentials" v-show="networkInFocusId == index">
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

  export default {
    name: 'Connect',
    data: function () {
      return {
        passkey: null,
        networkInFocusId: -1,
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
        this.clearConfig()
        this.showNetworkPanel = !this.showNetworkPanel
        if (this.showNetworkPanel) {
          this.$http
            .get(`http://${this.$store.state.selectedRobot}/wifi/get_networks`)
            .then(function (response) {
              this.availableNetworks = response.body.networks
            }, (response) => {
              console.log(`Failed to connect to ot-two: ${response}`)
            })
        }
      },
      clearConfig: function () {
        this.networkInFocusId = -1
        this.passkey = ''
      },
      sendWifiCredentials: function (ssid, passkey) {
        this.$store.dispatch('sendWifiCredentials', [ssid, passkey])
      },
      logout: function () {
        this.$router.push('/logout')
      },
      networkFocus: function (index) {
        if (this.networkInFocusId !== index) {
          this.passkey = ''
          this.networkInFocusId = index
        }
      }
    }
}
</script>



<style lang='sass'>
  @import "../assets/sass/components/networkConfig.scss";
</style>



