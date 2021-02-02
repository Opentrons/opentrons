// @flow
import { TestScheduler } from 'rxjs/testing'

import * as Cfg from '../../config'
import * as Actions from '../actions'
import { alertsEpic } from '../epic'

import type { State } from '../../types'
import type { Config } from '../../config/types'
import type { AlertId } from '../types'

jest.mock('../../config/selectors')

const getConfig: JestMockFn<[State], $Shape<Config> | null> = Cfg.getConfig

const MOCK_STATE: State = ({ mockState: true }: any)
const MOCK_ALERT_1: AlertId = ('mockAlert1': any)
const MOCK_ALERT_2: AlertId = ('mockAlert2': any)

describe('alerts epic', () => {
  let testScheduler

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should trigger a config:ADD_UNIQUE_VALUE to save persistent alert ignores', () => {
    getConfig.mockImplementation(state => {
      expect(state).toEqual(MOCK_STATE)
      return { alerts: { ignored: [MOCK_ALERT_1] } }
    })

    testScheduler.run(({ hot, expectObservable }) => {
      const action$ = hot('-a', {
        a: Actions.alertDismissed(MOCK_ALERT_2, true),
      })
      const state$ = hot('s-', { s: MOCK_STATE })
      const output$ = alertsEpic(action$, state$)

      expectObservable(output$).toBe('-a', {
        a: Cfg.addUniqueConfigValue('alerts.ignored', MOCK_ALERT_2),
      })
    })
  })
})
