<template>
  <nav class='connect'>
    <select @change='searchIfNecessary()' v-model='ports.selected' id='connections'>
      <option value='default'>{{defaultOption}}</option>
      <option value='refresh-list'>&#8635 refresh</option>
      <option v-for='option in ports.options' v-bind:value='option.value'>{{ option.text }}</option>
    </select>
    <div id='indicator' :class="{'connected': connected}"></div>
<button v-show='authenticated' @click='logout()' class='btn-run' :class="btn-run">Logout</button>
  </nav>
</template>


<script>
  import Opentrons from '../rest_api_wrapper'

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
      login () {
        console.log('logging in')
        if (window.lock === undefined) {
          window.lock = new window.Auth0Lock(
            'iHhlL8Eb1z3dPKwpYITqah7ZZdyGKvvx',
            'opentrons.auth0.com',
            {auth: { redirect: false }}
          )
        }
        window.lock.show()
        window.lock.on('authenticated', (authResult) => {
          localStorage.setItem('id_token', authResult.idToken)
          window.lock.getProfile(authResult.idToken, (err, profile) => {
            console.log(err)
            localStorage.setItem('profile', JSON.stringify(profile))
            this.authenticated = true
            this.email = profile.email
            window.Intercom(
              'update',
              {email: profile.email, user_id: profile.user_id}
            )
          })
          window.lock.hide()
        })
      },
      logout () {
        this.authenticated = false
        localStorage.removeItem('id_token')
        localStorage.removeItem('profile')
        window.Intercom('shutdown')
        window.Intercom('boot', {
          app_id: 'wbidvcze'
        })
      }
    },
    beforeMount: function () {
      this.getPortsList()
    }
  }
</script>
