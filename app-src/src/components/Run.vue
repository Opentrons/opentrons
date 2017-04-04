<template>
  <div id='run'>
    <button v-show='!running' @click='runProtocol()' class='btn-run' :class="{ greyOut: !connected }">Run Job</button>
    <button v-show='!authenticated' @click='login()' class='btn-run' :class="btn-run">Login</button>
    <button v-show='authenticated' @click='logout()' class='btn-run' :class="btn-run">Logout</button>
    <div class='controls'>
      <button v-show='!paused && running' @click='pauseProtocol()' class='btn btn-pause'></button>
      <button v-show='paused && running' @click='resumeProtocol()' class='btn btn-play'></button>
    </div>
  </div>
</template>

<script>
  import { trackEvent } from '../analytics'

  export default {
    name: 'Run',
    data: function () {
      return {
        authenticated: null,
        email: null
      }
    },
    mounted: function () {
      this.authenticated = localStorage.getItem('id_token')
      if (this.authenticated) {
        this.email = JSON.parse(localStorage.getItem('profile')).email
      }
    },
    methods: {
      runProtocol () {
        this.$store.dispatch('runProtocol')
        trackEvent('run-protocol', {
          'protocol-file': this.$store.state.fileName
        })
      },
      pauseProtocol () {
        this.$store.dispatch('pauseProtocol')
        trackEvent('pause-protocol')
      },
      resumeProtocol () {
        this.$store.dispatch('resumeProtocol')
        trackEvent('resume-protocol')
      },
      cancelProtocol () {
        this.$store.dispatch('cancelProtocol')
        trackEvent('cancel-protocol')
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
    computed: {
      running () {
        return this.$store.state.running
      },
      connected () {
        return this.$store.state.isConnected
      },
      paused () {
        return this.$store.state.paused
      },
      calibrated () {
        // TODO: Move this to state
        if (!this.$store.state.isConnected) return false
        if (this.$store.state.tasks.length === 0) return false

        return this.$store.state.tasks.every((instrument) => {
          let placeableCalibrated = instrument.placeables.every((placeable) => {
            return placeable.calibrated
          })
          return instrument.calibrated && placeableCalibrated
        })
      }
    }
  }
</script>
<style>
  .greyOut {
    background-color: gray;
  }
</style>
