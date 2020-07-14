// @flow
import {
  setupEpicTestMocks,
  runEpicTest,
} from '../../../../robot-api/__utils__'
import * as Fixtures from '../../__fixtures__'
import * as Actions from '../../actions'
import { labwareCalibrationEpic } from '..'

const makeTriggerActionAllCalibrations = robotName =>
  Actions.fetchAllLabwareCalibrations(robotName)

const makeTriggerActionFilterCalibrations = (
  robotName,
  loadName,
  namespace,
  version
) =>
  Actions.fetchAllLabwareCalibrations(
    robotName,
    (loadName = 'my_cute_labware'),
    (namespace = 'cutelabwares'),
    (version = 2)
  )

describe('fetch labware calibration epics', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('calls GET /labware/calibrations', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerActionAllCalibrations,
      Fixtures.mockFetchLabwareCalibrationSuccess
    )

    runEpicTest(mocks, ({ hot, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = labwareCalibrationEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(mocks.fetchRobotApi).toHaveBeenCalledWith(mocks.robot, {
        method: 'GET',
        path: '/labware/calibrations',
        query: {},
      })
    })
  })

  it('calls GET /labware/calibrations with query string', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerActionFilterCalibrations,
      Fixtures.mockFetchLabwareCalibrationSuccess
    )

    runEpicTest(mocks, ({ hot, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = labwareCalibrationEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(mocks.fetchRobotApi).toHaveBeenCalledWith(mocks.robot, {
        method: 'GET',
        path: '/labware/calibrations',
        query: {
          loadName: 'my_cute_labware',
          namespace: 'cutelabwares',
          version: 2,
        },
      })
    })
  })

  it('maps successful response to FETCH_LABWARE_CALAIBRATION_SUCCESS', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerActionAllCalibrations,
      Fixtures.mockFetchLabwareCalibrationSuccess
    )

    runEpicTest(mocks, ({ hot, expectObservable }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = labwareCalibrationEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchLabwareCalibrationsSuccess(
          mocks.robot.name,
          Fixtures.mockFetchLabwareCalibrationSuccess.body,
          {
            ...mocks.meta,
            response: Fixtures.mockFetchLabwareCalibrationSuccessMeta,
          }
        ),
      })
    })
  })

  it('maps failed response to FETCH_LABWARE_CALAIBRATION_FAILURE', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerActionAllCalibrations,
      Fixtures.mockFetchLabwareCalibrationFailure
    )

    runEpicTest(mocks, ({ hot, expectObservable }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = labwareCalibrationEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchLabwareCalibrationsFailure(
          mocks.robot.name,
          Fixtures.mockFetchLabwareCalibrationFailure.body,
          {
            ...mocks.meta,
            response: Fixtures.mockFetchLabwareCalibrationFailureMeta,
          }
        ),
      })
    })
  })
})
