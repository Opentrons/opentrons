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

describe('alerts selectors', () => {
  let state: State

  beforeEach(() => {
    getConfig.mockImplementation(s => {
      expect(s).toEqual(state)
      return { alerts: { ignored: [MOCK_IGNORED_ALERT] } }
    })
  })

  it('should be able to get a list of active alerts', () => {
    state = ({
      alerts: { active: [MOCK_ALERT_1, MOCK_ALERT_2], ignored: [] },
    }: $Shape<State>)
    expect(Selectors.getActiveAlerts(state)).toEqual([
      MOCK_ALERT_1,
      MOCK_ALERT_2,
    ])
  })

  it('should show no active alerts until config is loaded', () => {
    getConfig.mockReturnValue(null)
    state = ({
      alerts: { active: [MOCK_ALERT_1, MOCK_ALERT_2], ignored: [] },
    }: $Shape<State>)
    expect(Selectors.getActiveAlerts(state)).toEqual([])
  })

  it('should filter ignored alerts from active alerts', () => {
    // the reducer should never let this state happen, but let's protect
    // against it in the selector, too
    state = ({
      alerts: { active: [MOCK_ALERT_1, MOCK_ALERT_2], ignored: [MOCK_ALERT_2] },
    }: $Shape<State>)
    expect(Selectors.getActiveAlerts(state)).toEqual([MOCK_ALERT_1])
  })

  it('should filter perma-ignored alerts from active alerts', () => {
    state = ({
      alerts: { active: [MOCK_ALERT_1, MOCK_IGNORED_ALERT], ignored: [] },
    }: $Shape<State>)
    expect(Selectors.getActiveAlerts(state)).toEqual([MOCK_ALERT_1])
  })
})
