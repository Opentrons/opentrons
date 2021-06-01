import { initializeProfile, updateProfile } from '../profile'
import * as IntercomBinding from '../intercom-binding'

import type { Config } from '../../config/types'

type SupportConfig = Config['support']

const bootIntercom = IntercomBinding.bootIntercom as jest.MockedFunction<
  typeof IntercomBinding.bootIntercom
>
const updateIntercomProfile = IntercomBinding.updateIntercomProfile as jest.MockedFunction<
  typeof IntercomBinding.updateIntercomProfile
>
const setUserId = IntercomBinding.setUserId as jest.MockedFunction<
  typeof IntercomBinding.setUserId
>
const getIntercomAppId = IntercomBinding.getIntercomAppId as jest.MockedFunction<
  typeof IntercomBinding.getIntercomAppId
>

jest.mock('../intercom-binding')

describe('support profile tests', () => {
  const CONFIG: SupportConfig = {
    userId: 'some-user-id',
    createdAt: 1234,
    name: null,
    email: null,
  } as any

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
      'App Version': _PKG_VERSION_,
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
