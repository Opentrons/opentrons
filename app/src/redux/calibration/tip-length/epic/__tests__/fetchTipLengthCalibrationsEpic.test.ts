import {
  setupEpicTestMocks,
  runEpicTest,
} from '../../../../robot-api/__utils__'
import * as Fixtures from '../../__fixtures__'
import * as Actions from '../../actions'
import { tipLengthCalibrationsEpic } from '..'

import type { Action } from '../../../../types'

const makeTriggerActionAllCalibrations = (robotName: string) =>
  Actions.fetchTipLengthCalibrations(robotName)

describe('fetch pipette offset calibration epics', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('calls GET /calibrations/tip_length', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerActionAllCalibrations,
      Fixtures.mockFetchTipLengthCalibrationsSuccess
    )

    runEpicTest<Action>(mocks, ({ hot, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = tipLengthCalibrationsEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(mocks.fetchRobotApi).toHaveBeenCalledWith(mocks.robot, {
        method: 'GET',
        path: '/calibration/tip_length',
      })
    })
  })

  it('maps successful response to FETCH_TIP_LENGTH_CALIBRATIONS_SUCCESS', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerActionAllCalibrations,
      Fixtures.mockFetchTipLengthCalibrationsSuccess
    )

    runEpicTest<Action>(mocks, ({ hot, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = tipLengthCalibrationsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchTipLengthCalibrationsSuccess(
          mocks.robot.name,
          Fixtures.mockFetchTipLengthCalibrationsSuccess.body,
          {
            ...mocks.meta,
            response: Fixtures.mockFetchTipLengthCalibrationsSuccessMeta,
          }
        ),
      })
    })
  })

  it('maps failed response to FETCH_TIP_LENGTH_CALIBRATIONS_FAILURE', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerActionAllCalibrations,
      Fixtures.mockFetchTipLengthCalibrationsFailure
    )

    runEpicTest<Action>(mocks, ({ hot, expectObservable }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = tipLengthCalibrationsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchTipLengthCalibrationsFailure(
          mocks.robot.name,
          Fixtures.mockFetchTipLengthCalibrationsFailure.body,
          {
            ...mocks.meta,
            response: Fixtures.mockFetchTipLengthCalibrationsFailureMeta,
          }
        ),
      })
    })
  })
})
