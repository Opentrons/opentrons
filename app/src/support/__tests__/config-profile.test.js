// @flow

import { makeProfileUpdate } from '../profile'

import * as Alerts from '../../alerts'
import * as Config from '../../config'

import type { State } from '../../types'
import type { AlertId } from '../../alerts/types'

jest.mock('../../alerts/selectors')

const MOCK_STATE: State = ({ mockState: true }: any)

const getAlertIsPermanentlyIgnored: JestMockFn<
  [State, AlertId],
  boolean | null
> = Alerts.getAlertIsPermanentlyIgnored

describe('app config profile updates', () => {
  beforeEach(() => {
    getAlertIsPermanentlyIgnored.mockReturnValue(false)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should trigger an profile update if appUpdateAvailable is ignored', () => {
    getAlertIsPermanentlyIgnored.mockImplementation((state, alertId) => {
      expect(state).toEqual(MOCK_STATE)
      return alertId === Alerts.ALERT_APP_UPDATE_AVAILABLE
    })

    const action = Config.configValueUpdated('does not', 'matter')
    const result = makeProfileUpdate(action, MOCK_STATE)

    expect(result).toMatchObject({ appUpdateIgnored: true })
  })

  it('should trigger an profile update if appUpdateAvailable is not ignored', () => {
    const action = Config.configValueUpdated('does not', 'matter')
    const result = makeProfileUpdate(action, MOCK_STATE)

    expect(result).toMatchObject({ appUpdateIgnored: false })
  })
})
