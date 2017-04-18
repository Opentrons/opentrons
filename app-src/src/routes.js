import Vue from 'vue'

import config from './config'
import store from './store/store'

// This is not in GTM because sending email data to GTM violoates
// the GTM User Policy
function emitAppUserInfo (userId, userEmail) {
  window.ot_dataLayer.push({userId: userId})
  console.log(window.intercomSettings)
  window.intercomSettings = {
    user_id: userId,
    email: userEmail
  }
  window.Intercom('update')
}

function restartIntercom () {
  window.Intercom('shutdown')
  window.Intercom('boot', {app_id: config.INTERCOM_APP_ID})
}

/*
 * Instatiate lock object once and persist globally
 */
function getLock () {
  if (!window.lock) {
    window.lock = new window.Auth0Lock(
      config.AUTH0_CLIENT_ID,
      config.AUTH0_DOMAIN,
      {auth: { redirect: false }}
    )
  }
  return window.lock
}

/*
 * Displays Auth0 Lock popup, calls onSuccessfulLogin on successful login
 * otherwise calls onErrorCb if authentication failed
 */
function showLockPopup (lock, onSuccessfulLogin, onErrorCb) {
  lock.show()
  lock.on('authenticated', (authResult) => {
    lock.getProfile(authResult.idToken, (err, profile) => {
      if (err) {
        onErrorCb(err)
      } else {
        onSuccessfulLogin(authResult, profile)
      }
      lock.hide()
    })
  })
}

/*
 * Persists user login info into VueJS state and browsers localStorage
 */
function loginUser (authResult, profile) {
  // Save Auth0 data to browser
  localStorage.setItem('id_token', authResult.idToken)
  localStorage.setItem('profile', JSON.stringify(profile))

  // Send data to intercom/GA
  emitAppUserInfo(profile.user_id, profile.email)

  // Update state
  store.commit('AUTHENTICATE', {isAuthenticated: true, userProfile: profile})
}

/*
 * Removes auth data from browser and updates VueJS state
 * Updates intercom with fake login creds
 */
function logoutUser () {
  localStorage.removeItem('id_token')
  localStorage.removeItem('profile')
  // const fakeId = getFakeUserID()
  // emitAppUserInfo(fakeId, `${fakeId}@opentrons.com`)
  store.commit('AUTHENTICATE', {isAuthenticated: false, userProfile: null})
  emitAppUserInfo()
  restartIntercom()
}

const loginRoute = {
  path: '/login',
  beforeEnter: (to, from, next) => {
    Vue.nextTick(() => {
      showLockPopup(getLock(), loginUser, console.log)
    })
    next(from)  // Redirect to previous page
  }
}

const logoutRoute = {
  path: '/logout',
  beforeEnter: (to, from, next) => {
    logoutUser()
    next(from)  // Redirect to previous page
  }
}

module.exports = { loginRoute, logoutRoute, loginUser, logoutUser }
