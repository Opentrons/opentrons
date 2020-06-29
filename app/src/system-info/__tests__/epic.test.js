// @flow
import { TestScheduler } from 'rxjs/testing'

import * as Alerts from '../../alerts'
import type { State } from '../../types'
import { NOT_APPLICABLE, OUTDATED, UP_TO_DATE } from '../constants'
import { systemInfoEpic } from '../epic'
import * as Selectors from '../selectors'
import type { DriverStatus } from '../types'

jest.mock('../selectors')

const MOCK_STATE: State = ({ mockState: true }: any)

const getU2EWindowsDriverStatus: JestMockFn<[State], DriverStatus> =
  Selectors.getU2EWindowsDriverStatus

describe('system info epic', () => {
  let testScheduler

  const expectOutput = (
    statusValues: Array<DriverStatus>,
    expectedMarbles,
    expectedValues
  ) => {
    statusValues.forEach(status => {
      getU2EWindowsDriverStatus.mockImplementationOnce(s => {
        expect(s).toEqual(MOCK_STATE)
        return status
      })
    })

    testScheduler.run(({ hot, expectObservable }) => {
      const action$ = hot('----')
      const state$ = hot('-s-s', { s: MOCK_STATE })
      const output$ = systemInfoEpic(action$, state$)

      expectObservable(output$).toBe(expectedMarbles, expectedValues)
    })
  }

  beforeEach(() => {
    getU2EWindowsDriverStatus.mockImplementation(s => {
      expect(s).toEqual(MOCK_STATE)
      return NOT_APPLICABLE
    })
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
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
