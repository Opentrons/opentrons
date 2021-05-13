// @flow

import {
  setupEpicTestMocks,
  runEpicTest,
} from '../../../../robot-api/__utils__'
import * as Fixtures from '../../__fixtures__'
import * as Actions from '../../actions'
import { pipetteOffsetCalibrationsEpic } from '..'

const makeTriggerActionAllCalibrations = robotName =>
  Actions.fetchPipetteOffsetCalibrations(robotName)

describe('fetch pipette offset calibration epics', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('calls GET /calibrations/pipette_offset', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerActionAllCalibrations,
      Fixtures.mockFetchPipetteOffsetCalibrationsSuccess
    )

    runEpicTest(mocks, ({ hot, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = pipetteOffsetCalibrationsEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(mocks.fetchRobotApi).toHaveBeenCalledWith(mocks.robot, {
        method: 'GET',
        path: '/calibration/pipette_offset',
      })
    })
  })

  it('maps successful response to FETCH_PIPETTE_OFFSET_CALIBRATIONS_SUCCESS', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerActionAllCalibrations,
      Fixtures.mockFetchPipetteOffsetCalibrationsSuccess
    )

    runEpicTest(mocks, ({ hot, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = pipetteOffsetCalibrationsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchPipetteOffsetCalibrationsSuccess(
          mocks.robot.name,
          Fixtures.mockFetchPipetteOffsetCalibrationsSuccess.body,
          {
            ...mocks.meta,
            response: Fixtures.mockFetchPipetteOffsetCalibrationsSuccessMeta,
          }
        ),
      })
    })
  })

  it('maps failed response to FETCH_PIPETTE_OFFSET_CALIBRATIONS_FAILURE', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerActionAllCalibrations,
      Fixtures.mockFetchPipetteOffsetCalibrationsFailure
    )

    runEpicTest(mocks, ({ hot, expectObservable }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = pipetteOffsetCalibrationsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchPipetteOffsetCalibrationsFailure(
          mocks.robot.name,
          Fixtures.mockFetchPipetteOffsetCalibrationsFailure.body,
          {
            ...mocks.meta,
            response: Fixtures.mockFetchPipetteOffsetCalibrationsFailureMeta,
          }
        ),
      })
    })
  })
})
