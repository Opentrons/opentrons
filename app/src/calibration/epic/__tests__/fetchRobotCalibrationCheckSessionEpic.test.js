// @flow
import { setupEpicTestMocks, runEpicTest } from '../../../robot-api/__utils__'
import { mockRequestMeta } from '../../../robot-api/__fixtures__'
import * as Fixtures from '../../__fixtures__'
import * as Actions from '../../actions'
import { calibrationEpic } from '..'

jest.mock('../../../robot-api/http')
jest.mock('../../../discovery/selectors')

const makeTriggerAction = robotName =>
  Actions.fetchRobotCalibrationCheckSession(robotName)

describe('fetchRobotCalibrationCheckSessionEpic', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('handles fetch calibration check session', () => {
    it('calls GET /calibration/check/session', () => {
      const mocks = setupEpicTestMocks(
        makeTriggerAction,
        Fixtures.mockFetchCheckSessionSuccess
      )

      runEpicTest(mocks, ({ hot, expectObservable, flush }) => {
        const action$ = hot('--a', { a: mocks.action })
        const state$ = hot('s-s', { s: mocks.state })
        const output$ = calibrationEpic(action$, state$)

        expectObservable(output$)
        flush()

        expect(mocks.fetchRobotApi).toHaveBeenCalledWith(mocks.robot, {
          method: 'GET',
          path: '/calibration/check/session',
        })
      })
    })

    it('maps successful response to FETCH_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS', () => {
      const mocks = setupEpicTestMocks(
        makeTriggerAction,
        Fixtures.mockFetchCheckSessionSuccess
      )

      runEpicTest(mocks, ({ hot, expectObservable, flush }) => {
        const action$ = hot('--a', { a: mocks.action })
        const state$ = hot('s-s', { s: mocks.state })
        const output$ = calibrationEpic(action$, state$)

        expectObservable(output$).toBe('--a', {
          a: Actions.fetchRobotCalibrationCheckSessionSuccess(
            mocks.robot.name,
            Fixtures.mockFetchCheckSessionSuccess.body,
            {
              ...mocks.meta,
              response: Fixtures.mockFetchCheckSessionSuccessMeta,
            }
          ),
        })
      })
    })

    it('maps failed response to FETCH_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE', () => {
      const mocks = setupEpicTestMocks(
        makeTriggerAction,
        Fixtures.mockFetchCheckSessionFailure
      )

      runEpicTest(mocks, ({ hot, expectObservable, flush }) => {
        const action$ = hot('--a', { a: mocks.action })
        const state$ = hot('s-s', { s: mocks.state })
        const output$ = calibrationEpic(action$, state$)

        expectObservable(output$).toBe('--a', {
          a: Actions.fetchRobotCalibrationCheckSessionFailure(
            mocks.robot.name,
            { message: 'AH' },
            {
              ...mocks.meta,
              response: Fixtures.mockFetchCheckSessionFailureMeta,
            }
          ),
        })
      })
    })

    it('maps not found response to CREATE_ROBOT_CALIBRATION_CHECK_SESSION', () => {
      const mocks = setupEpicTestMocks(
        makeTriggerAction,
        Fixtures.mockFetchCheckSessionFailure
      )

      runEpicTest(mocks, ({ hot, cold, expectObservable, flush }) => {
        mocks.fetchRobotApi.mockReturnValue(
          cold('r', {
            r: {
              ...Fixtures.mockFetchCheckSessionFailure,
              status: 404,
            },
          })
        )
        const action$ = hot('--a', { a: mocks.action })
        const state$ = hot('s-s', { s: mocks.state })
        const output$ = calibrationEpic(action$, state$)

        expectObservable(output$).toBe('--a', {
          a: Actions.createRobotCalibrationCheckSession(
            mocks.robot.name,
            mockRequestMeta
          ),
        })
      })
    })
  })
})
