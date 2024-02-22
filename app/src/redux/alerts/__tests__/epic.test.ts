import { vi, describe, it, expect, beforeEach } from 'vitest'
import { TestScheduler } from 'rxjs/testing'

import * as Cfg from '../../config'
import * as Actions from '../actions'
import { alertsEpic } from '../epic'

import type { Action, State } from '../../types'
import type { AlertId } from '../types'

vi.mock('../../config/selectors')

const MOCK_STATE: State = { mockState: true } as any
const MOCK_ALERT_1: AlertId = 'mockAlert1' as any
const MOCK_ALERT_2: AlertId = 'mockAlert2' as any

describe('alerts epic', () => {
  let testScheduler: TestScheduler

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  it('should trigger a config:ADD_UNIQUE_VALUE to save persistent alert ignores', () => {
    vi.mocked(
      (Cfg as any).getConfig((state: State) => {
        expect(state).toEqual(MOCK_STATE)
        return { alerts: { ignored: [MOCK_ALERT_1] } }
      })
    )

    testScheduler.run(({ hot, expectObservable }) => {
      const action$ = hot<Action>('-a', {
        a: Actions.alertDismissed(MOCK_ALERT_2, true),
      })
      const state$ = hot<State>('s-', { s: MOCK_STATE })
      const output$ = alertsEpic(action$, state$)

      expectObservable(output$).toBe('-a', {
        a: Cfg.addUniqueConfigValue('alerts.ignored', MOCK_ALERT_2),
      })
    })
  })
})
