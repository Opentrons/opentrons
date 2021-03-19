// @flow

import * as IntercomBinding from '../intercom-binding'
import * as Constants from '../constants'

describe('calling the intercom js api', () => {
  const intercom = jest.fn()
  beforeEach(() => {
    global.Intercom = intercom
    process.env.OT_APP_INTERCOM_ID = 'some-intercom-app-id'
    IntercomBinding.setUserId('dummy')
  })
  afterEach(() => {
    jest.resetAllMocks()
    delete global.Intercom
    delete process.env.OT_APP_INTERCOM_ID
    IntercomBinding.setUserId(null)
  })

  it('should not boot the intercom api if the global is not present', () => {
    delete global.Intercom
    IntercomBinding.bootIntercom({})
    expect(intercom).not.toHaveBeenCalled()
  })

  it('should not update intercom profiles if the global is not present', () => {
    delete global.Intercom
    IntercomBinding.updateIntercomProfile({})
    expect(intercom).not.toHaveBeenCalled()
  })

  it('should not send intercom events if the global is not present', () => {
    delete global.Intercom
    IntercomBinding.sendIntercomEvent('someEvent', {})
    expect(intercom).not.toHaveBeenCalled()
  })

  it('should not boot the intercom api with no app id', () => {
    delete process.env.OT_APP_INTERCOM_ID
    IntercomBinding.bootIntercom({})
    expect(intercom).not.toHaveBeenCalled()
  })

  it('should not update intercom profiles with no app id', () => {
    delete process.env.OT_APP_INTERCOM_ID
    IntercomBinding.updateIntercomProfile({})
    expect(intercom).not.toHaveBeenCalled()
  })

  it('should not send intercom events with no app id', () => {
    delete process.env.OT_APP_INTERCOM_ID
    IntercomBinding.sendIntercomEvent('someEvent', {})
    expect(intercom).not.toHaveBeenCalled()
  })

  it('should not boot the intercom api with no user id', () => {
    IntercomBinding.setUserId(null)
    IntercomBinding.bootIntercom({})
    expect(intercom).not.toHaveBeenCalled()
  })

  it('should not update intercom profiles with no user id', () => {
    IntercomBinding.setUserId(null)
    IntercomBinding.updateIntercomProfile({})
    expect(intercom).not.toHaveBeenCalled()
  })

  it('should not send intercom events with no user id', () => {
    IntercomBinding.setUserId(null)
    IntercomBinding.sendIntercomEvent('someDummyEvent', {})
    expect(intercom).not.toHaveBeenCalled()
  })

  it('should update its let-bound user id', () => {
    IntercomBinding.setUserId('dummy-user')
    IntercomBinding.bootIntercom({ some: 'prop' })
    expect(intercom).toHaveBeenCalledWith('boot', {
      user_id: 'dummy-user',
      some: 'prop',
    })
  })

  it('should expose its app id', () => {
    expect(IntercomBinding.getIntercomAppId()).toEqual('some-intercom-app-id')
  })

  it('should pass boot args to intercom', () => {
    IntercomBinding.bootIntercom({ some: 'value', other: 'value' })
    expect(intercom).toHaveBeenCalledWith('boot', {
      some: 'value',
      other: 'value',
      user_id: 'dummy',
    })
  })

  it('should pass update profile args to intercom', () => {
    IntercomBinding.updateIntercomProfile({ some: 'value', other: 'value' })
    expect(intercom).toHaveBeenCalledWith('update', {
      some: 'value',
      other: 'value',
      user_id: 'dummy',
    })
  })

  it('should pass event args to intercom', () => {
    IntercomBinding.sendIntercomEvent(
      Constants.INTERCOM_EVENT_CALCHECK_COMPLETE,
      { some: 'metadata' }
    )
    expect(intercom).toHaveBeenCalledWith(
      'trackEvent',
      Constants.INTERCOM_EVENT_CALCHECK_COMPLETE,
      { some: 'metadata' }
    )
  })
})
