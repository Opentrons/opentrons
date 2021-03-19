// @flow

import * as Cfg from '../../config'
import * as Selectors from '../selectors'

import type { State } from '../../types'
import type { Config } from '../../config/types'
import type { AlertId } from '../types'

jest.mock('../../config/selectors')

const getConfig: JestMockFn<[State], $Shape<Config> | null> = Cfg.getConfig

const MOCK_ALERT_1: AlertId = ('mockAlert1': any)
const MOCK_ALERT_2: AlertId = ('mockAlert2': any)
const MOCK_IGNORED_ALERT: AlertId = ('mockIgnoredAlert': any)

const MOCK_CONFIG: $Shape<Config> = {
  alerts: { ignored: [MOCK_IGNORED_ALERT] },
}

describe('alerts selectors', () => {
  const stubGetConfig = (state: State, value = MOCK_CONFIG) => {
    getConfig.mockImplementation(s => {
      expect(s).toEqual(state)
      return value
    })
  }

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should be able to get a list of active alerts', () => {
    const state = ({
      alerts: { active: [MOCK_ALERT_1, MOCK_ALERT_2], ignored: [] },
    }: $Shape<State>)

    stubGetConfig(state)

    expect(Selectors.getActiveAlerts(state)).toEqual([
      MOCK_ALERT_1,
      MOCK_ALERT_2,
    ])
  })

  it('should show no active alerts until config is loaded', () => {
    const state = ({
      alerts: { active: [MOCK_ALERT_1, MOCK_ALERT_2], ignored: [] },
    }: $Shape<State>)

    stubGetConfig(state, null)

    expect(Selectors.getActiveAlerts(state)).toEqual([])
  })

  it('should filter ignored alerts from active alerts', () => {
    // the reducer should never let this state happen, but let's protect
    // against it in the selector, too
    const state = ({
      alerts: { active: [MOCK_ALERT_1, MOCK_ALERT_2], ignored: [MOCK_ALERT_2] },
    }: $Shape<State>)

    stubGetConfig(state)

    expect(Selectors.getActiveAlerts(state)).toEqual([MOCK_ALERT_1])
  })

  it('should filter perma-ignored alerts from active alerts', () => {
    const state = ({
      alerts: { active: [MOCK_ALERT_1, MOCK_IGNORED_ALERT], ignored: [] },
    }: $Shape<State>)

    stubGetConfig(state)

    expect(Selectors.getActiveAlerts(state)).toEqual([MOCK_ALERT_1])
  })

  it('should be able to tell you if an alert is perma-ignored', () => {
    const state = ({ alerts: { active: [], ignored: [] } }: $Shape<State>)

    stubGetConfig(state)

    expect(
      Selectors.getAlertIsPermanentlyIgnored(state, MOCK_IGNORED_ALERT)
    ).toBe(true)

    expect(Selectors.getAlertIsPermanentlyIgnored(state, MOCK_ALERT_1)).toBe(
      false
    )
  })

  it('should return null for getAlertIsPermanentlyIgnored if config not initialized', () => {
    const state = ({ alerts: { active: [], ignored: [] } }: $Shape<State>)

    stubGetConfig(state, null)

    expect(
      Selectors.getAlertIsPermanentlyIgnored(state, MOCK_IGNORED_ALERT)
    ).toBe(null)
  })
})
