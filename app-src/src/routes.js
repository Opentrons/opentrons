import store from './store/store'
import { getFakeUserID } from './util'

function emitAppUserId (userId, userEmail) {
  window.ot_dataLayer.push({UserId: userId})
  if (userId) {
    window.intercomSettings = {
      user_id: userId,
      user_email: userEmail
    }
  } else {
    window.intercomSettings = {}
  }
  console.log('IC', window.intercomSettings)
  window.Intercom('update')
}

export const loginRoute = {
  path: '/login',
  beforeEnter: (to, from, next) => {
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
        emitAppUserId(profile.user_id, profile.email)
        store.commit('AUTHENTICATE', {isAuthenticated: true, userProfile: profile})
        window.lock.hide()
      })
    })
    next(from)  // Redirect to previous page
  }
}

export const logoutRoute = {
  path: '/logout',
  beforeEnter: (to, from, next) => {
    localStorage.removeItem('id_token')
    localStorage.removeItem('profile')
    const fakeId = getFakeUserID()
    console.log(fakeId)
    // emitAppUserId(fakeId, `${fakeId}@opentrons.com`)
    emitAppUserId(null, null)
    window.Intercom('shutdown')
    window.Intercom('boot', {app_id: 'bsgvg3q7'})
    store.commit('AUTHENTICATE', {isAuthenticated: false, userProfile: null})
    next(from)  // Redirect to previous page
  }
}
