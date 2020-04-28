// @flow
import { version } from '../../../package.json'
import { initializeProfile, updateProfile } from '../profile'

import type { Config } from '../../config/types'

type SupportConfig = $PropertyType<Config, 'support'>

describe('support profile tests', () => {
  const intercom = jest.fn()
  const CONFIG: SupportConfig = {
    userId: 'some-user-id',
    createdAt: 1234,
    name: 'Some Name',
    email: null,
  }

  beforeEach(() => {
    process.env.OT_APP_INTERCOM_ID = 'some-intercom-app-id'
    global.Intercom = intercom
  })

  afterEach(() => {
    jest.resetAllMocks()
    delete process.env.OT_APP_INTERCOM_ID
    delete global.Intercom
  })

  it('should be able to initialize Intercom with a user_id', () => {
    initializeProfile(CONFIG)

    expect(intercom).toHaveBeenCalledWith('boot', {
      app_id: 'some-intercom-app-id',
      user_id: 'some-user-id',
      created_at: 1234,
      name: 'Some Name',
      'App Version': version,
    })
  })

  it('should noop boot calls if no intercom app ID', () => {
    delete process.env.OT_APP_INTERCOM_ID
    initializeProfile(CONFIG)
    expect(intercom).toHaveBeenCalledTimes(0)
  })

  it('should noop boot calls if no global.Intercom', () => {
    delete global.Intercom
    initializeProfile(CONFIG)
    expect(intercom).toHaveBeenCalledTimes(0)
  })

  it('should be able to update the Intercom profile', () => {
    initializeProfile(CONFIG)
    updateProfile({ some: 'update' })

    expect(intercom).toHaveBeenCalledWith('update', {
      user_id: 'some-user-id',
      some: 'update',
    })
  })

  it('should noop update calls if no intercom app ID', () => {
    delete process.env.OT_APP_INTERCOM_ID
    initializeProfile(CONFIG)
    updateProfile({ some: 'update' })
    expect(intercom).toHaveBeenCalledTimes(0)
  })

  it('should noop update calls if no global.Intercom', () => {
    delete global.Intercom
    initializeProfile(CONFIG)
    updateProfile({ some: 'update' })
    expect(intercom).toHaveBeenCalledTimes(0)
  })
})
