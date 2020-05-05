// @flow
import { TestScheduler } from 'rxjs/testing'

import * as Alerts from '../../alerts'
import * as Fixtures from '../__fixtures__'
import * as Selectors from '../selectors'
import * as Utils from '../utils'
import { UP_TO_DATE, OUTDATED } from '../constants'
import { systemInfoEpic } from '../epic'

import type { State } from '../../types'
import type { UsbDevice, DriverStatus } from '../types'

jest.mock('../selectors')
jest.mock('../utils')

const MOCK_STATE: State = ({ mockState: true }: any)

const DEVICE = Fixtures.mockWindowsRealtekDevice

const getU2EAdapterDevice: JestMockFn<[State], UsbDevice | null> =
  Selectors.getU2EAdapterDevice

const getDriverStatus: JestMockFn<[UsbDevice], DriverStatus> =
  Utils.getDriverStatus

describe('system info epic', () => {
  let testScheduler

  const expectOutput = (expectedMarbles, expectedValues) => {
    testScheduler.run(({ hot, expectObservable }) => {
      const action$ = hot('--')
      const state$ = hot('-s', { s: MOCK_STATE })
      const output$ = systemInfoEpic(action$, state$)

      expectObservable(output$).toBe(expectedMarbles, expectedValues)
    })
  }

  beforeEach(() => {
    getU2EAdapterDevice.mockImplementation(s => {
      expect(s).toEqual(MOCK_STATE)
      return DEVICE
    })

    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should not trigger an alert if systemInfo:INITIALIZED comes in with up to date driver', () => {
    getDriverStatus.mockImplementation(d => {
      expect(d).toEqual(DEVICE)
      return UP_TO_DATE
    })

    expectOutput('--')
  })

  it('should trigger an alert if systemInfo:INITIALIZED comes in with out of date driver', () => {
    getDriverStatus.mockImplementation(d => {
      expect(d).toEqual(DEVICE)
      return OUTDATED
    })

    expectOutput('-a', {
      a: Alerts.alertTriggered(Alerts.ALERT_U2E_DRIVER_OUTDATTED),
    })
  })
})
