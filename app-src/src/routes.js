import store from './store/store'
import { getFakeUserID } from './util'

// TODO: consider moving to GTM tag ?
function emitAppUserId (userId, userEmail) {
  window.ot_dataLayer.push({userId: userId})
  console.log(window.intercomSettings)
  window.intercomSettings = {
    user_id: userId,
    email: userEmail
  }
  window.Intercom('update')
}

/*
 * Instatiate lock object once and persist globally
 */
function getLock () {
  if (!window.lock) {
    window.lock = new window.Auth0Lock(
      'iHhlL8Eb1z3dPKwpYITqah7ZZdyGKvvx',
      'opentrons.auth0.com',
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
  // Save JWT
  localStorage.setItem('id_token', authResult.idToken)

  // Save profile to browser
  localStorage.setItem('profile', JSON.stringify(profile))

  // Send data to intercom/GA
  emitAppUserId(profile.user_id, profile.email)

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
  const fakeId = getFakeUserID()
  emitAppUserId(fakeId, `${fakeId}@opentrons.com`)
  store.commit('AUTHENTICATE', {isAuthenticated: false, userProfile: null})
}

export const loginRoute = {
  path: '/login',
  beforeEnter: (to, from, next) => {
    showLockPopup(getLock(), loginUser, console.log)
    next(from)  // Redirect to previous page
  }
}

export const logoutRoute = {
  path: '/logout',
  beforeEnter: (to, from, next) => {
    logoutUser()
    next(from)  // Redirect to previous page
  }
}
