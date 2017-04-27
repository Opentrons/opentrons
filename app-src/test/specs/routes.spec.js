import { expect } from 'chai'

import sinon from 'sinon'
import { loginUser, logoutUser } from 'src/login-routes'

describe('Login Routes', () => {
  it('sets user info on login', () => {
    window.ot_dataLayer = []
    window.Intercom = sinon.spy()
    const userProfile = {user_id: 'foo-bar'}
    loginUser({idToken: '123'}, userProfile)
    expect(window.localStorage.getItem('id_token')).to.equal('123')
    expect(window.localStorage.getItem('profile')).to.equal(JSON.stringify(userProfile))
    expect(window.ot_dataLayer.length).to.equal(1)
    delete window.ot_dataLayer
  })

  it('unsets user info on logout', () => {
    window.ot_dataLayer = []
    window.Intercom = sinon.spy()
    loginUser({idToken: '123'}, {user_id: 'foo-bar'})
    logoutUser()
    expect(window.localStorage.getItem('id_token')).to.null
    expect(window.localStorage.getItem('profile')).to.null
    expect(window.ot_dataLayer.length).to.equal(2)
    delete window.ot_dataLayer
  })
})
