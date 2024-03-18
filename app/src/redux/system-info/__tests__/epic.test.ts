import { vi, describe, it, expect, beforeEach } from 'vitest'
import { TestScheduler } from 'rxjs/testing'

import * as Alerts from '../../alerts'
import * as Selectors from '../selectors'
import { NOT_APPLICABLE, UP_TO_DATE, OUTDATED } from '../constants'
import { systemInfoEpic } from '../epic'

import type { Action, State } from '../../types'
import type { DriverStatus } from '../types'

vi.mock('../selectors')

const MOCK_STATE: State = { mockState: true } as any

describe('system info epic', () => {
  let testScheduler: TestScheduler

  const expectOutput = (
    statusValues: DriverStatus[],
    expectedMarbles: string,
    expectedValues?: unknown
  ): void => {
    statusValues.forEach(status => {
      vi.mocked(Selectors.getU2EWindowsDriverStatus).mockImplementationOnce(
        s => {
          expect(s).toEqual(MOCK_STATE)
          return status
        }
      )
    })

    testScheduler.run(({ hot, expectObservable }) => {
      const action$ = hot<Action>('----')
      const state$ = hot<State>('-s-s', { s: MOCK_STATE })
      const output$ = systemInfoEpic(action$, state$)

      expectObservable(output$).toBe(expectedMarbles, expectedValues)
    })
  }

  beforeEach(() => {
    vi.mocked(Selectors.getU2EWindowsDriverStatus).mockImplementation(s => {
      expect(s).toEqual(MOCK_STATE)
      return NOT_APPLICABLE
    })
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  it('should not trigger an alert if driver status never changes', () => {
    expectOutput([], '----')
  })

  it('should trigger an alert if status changes to OUTDATED', () => {
    expectOutput([UP_TO_DATE, OUTDATED], '---a', {
      a: Alerts.alertTriggered(Alerts.ALERT_U2E_DRIVER_OUTDATED),
    })
  })

  it('should not trigger an alert if status stays OUTDATED', () => {
    expectOutput([OUTDATED, OUTDATED], '----')
  })
})
