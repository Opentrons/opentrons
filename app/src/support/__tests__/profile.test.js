// @flow
import { version } from '../../../package.json'
import { initializeProfile, updateProfile } from '../profile'
import * as IntercomBinding from '../intercom-binding'
import type { IntercomPayload } from '../types'

import type { Config } from '../../config/types'

type SupportConfig = $PropertyType<Config, 'support'>

const bootIntercom: JestMockFn<[IntercomPayload], void> =
  IntercomBinding.bootIntercom
const updateIntercomProfile: JestMockFn<[IntercomPayload], void> =
  IntercomBinding.updateIntercomProfile
const setUserId: JestMockFn<[string], void> = IntercomBinding.setUserId
const getIntercomAppId: JestMockFn<[], ?string> =
  IntercomBinding.getIntercomAppId

jest.mock('../intercom-binding')

describe('support profile tests', () => {
  const CONFIG: SupportConfig = {
    userId: 'some-user-id',
    createdAt: 1234,
    name: null,
    email: null,
  }

  beforeEach(() => {
    getIntercomAppId.mockReturnValue('some-intercom-app-id')
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should be able to initialize Intercom with a user_id', () => {
    initializeProfile(CONFIG)
    expect(setUserId).toHaveBeenCalledWith('some-user-id')
    expect(bootIntercom).toHaveBeenCalledWith({
      app_id: 'some-intercom-app-id',
      created_at: 1234,
      'App Version': version,
    })
  })

  it('should be able to update the Intercom profile', () => {
    initializeProfile(CONFIG)
    updateProfile({ some: 'update' })

    expect(updateIntercomProfile).toHaveBeenCalledWith({
      some: 'update',
    })
  })
})
