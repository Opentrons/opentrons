import * as Cfg from '../../config'
import * as Selectors from '../selectors'

import type { State } from '../../types'
import type { Config } from '../../config/types'
import type { AlertId } from '../types'

jest.mock('../../config/selectors')

const getConfig = Cfg.getConfig as jest.MockedFunction<typeof Cfg.getConfig>

const MOCK_ALERT_1: AlertId = 'mockAlert1' as any
const MOCK_ALERT_2: AlertId = 'mockAlert2' as any
const MOCK_IGNORED_ALERT: AlertId = 'mockIgnoredAlert' as any

const MOCK_CONFIG: Config = {
  alerts: { ignored: [MOCK_IGNORED_ALERT] },
} as any

describe('alerts selectors', () => {
  const stubGetConfig = (state: State, value = MOCK_CONFIG) => {
    getConfig.mockImplementation((s: State) => {
      expect(s).toEqual(state)
      return value
    })
  }

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should be able to get a list of active alerts', () => {
    const state: State = {
      alerts: { active: [MOCK_ALERT_1, MOCK_ALERT_2], ignored: [] },
    } as any

    stubGetConfig(state)

    expect(Selectors.getActiveAlerts(state)).toEqual([
      MOCK_ALERT_1,
      MOCK_ALERT_2,
    ])
  })

  it('should show no active alerts until config is loaded', () => {
    const state: State = {
      alerts: { active: [MOCK_ALERT_1, MOCK_ALERT_2], ignored: [] },
    } as any

    stubGetConfig(state, null as any)

    expect(Selectors.getActiveAlerts(state)).toEqual([])
  })

  it('should filter ignored alerts from active alerts', () => {
    // the reducer should never let this state happen, but let's protect
    // against it in the selector, too
    const state: State = {
      alerts: { active: [MOCK_ALERT_1, MOCK_ALERT_2], ignored: [MOCK_ALERT_2] },
    } as any

    stubGetConfig(state)

    expect(Selectors.getActiveAlerts(state)).toEqual([MOCK_ALERT_1])
  })

  it('should filter perma-ignored alerts from active alerts', () => {
    const state: State = {
      alerts: { active: [MOCK_ALERT_1, MOCK_IGNORED_ALERT], ignored: [] },
    } as any

    stubGetConfig(state)

    expect(Selectors.getActiveAlerts(state)).toEqual([MOCK_ALERT_1])
  })

  it('should be able to tell you if an alert is perma-ignored', () => {
    const state: State = { alerts: { active: [], ignored: [] } } as any

    stubGetConfig(state)

    expect(
      Selectors.getAlertIsPermanentlyIgnored(state, MOCK_IGNORED_ALERT)
    ).toBe(true)

    expect(Selectors.getAlertIsPermanentlyIgnored(state, MOCK_ALERT_1)).toBe(
      false
    )
  })

  it('should return null for getAlertIsPermanentlyIgnored if config not initialized', () => {
    const state: State = { alerts: { active: [], ignored: [] } } as any

    stubGetConfig(state, null as any)

    expect(
      Selectors.getAlertIsPermanentlyIgnored(state, MOCK_IGNORED_ALERT)
    ).toBe(null)
  })
})
