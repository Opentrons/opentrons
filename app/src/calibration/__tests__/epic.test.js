// @flow
import { TestScheduler } from 'rxjs/testing'

import * as RobotApiHttp from '../../robot-api/http'
import * as DiscoverySelectors from '../../discovery/selectors'
import * as Fixtures from '../__fixtures__'
import * as Actions from '../actions'
import { calibrationEpic } from '../epic'
import type { Observable } from 'rxjs'
import type {
  RobotHost,
  RobotApiRequestOptions,
  RobotApiResponse,
} from '../../robot-api/types'

jest.mock('../../robot-api/http')
jest.mock('../../discovery/selectors')

const mockFetchRobotApi: JestMockFn<
  [RobotHost, RobotApiRequestOptions],
  Observable<RobotApiResponse>
> = RobotApiHttp.fetchRobotApi

const mockGetRobotByName: JestMockFn<[any, string], mixed> =
  DiscoverySelectors.getRobotByName

const mockRobot = Fixtures.mockRobot
const mockState = { state: true }

describe('calibrationEpics', () => {
  let testScheduler

  beforeEach(() => {
    mockGetRobotByName.mockReturnValue(mockRobot)

    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('createRobotCalibrationCheckSessionEpic', () => {
    describe('handles explicit CREATE CHECK SESSION', () => {
      const action = Actions.createRobotCalibrationCheckSession(mockRobot.name)
      const expectedRequest = {
        method: 'POST',
        path: '/calibration/check/session',
      }

      it('calls POST /calibration/check/session', () => {
        testScheduler.run(({ hot, cold, expectObservable, flush }) => {
          mockFetchRobotApi.mockReturnValue(
            cold('r', { r: Fixtures.mockCreateCheckSessionSuccess })
          )

          const action$ = hot('--a', { a: action })
          const state$ = hot('a-a', { a: mockState })
          const output$ = calibrationEpic(action$, state$)

          expectObservable(output$)
          flush()

          expect(mockFetchRobotApi).toHaveBeenCalledWith(
            mockRobot,
            expectedRequest
          )
        })
      })

      it('maps successful response to CREATE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS', () => {
        testScheduler.run(({ hot, cold, expectObservable, flush }) => {
          mockFetchRobotApi.mockReturnValue(
            cold('r', { r: Fixtures.mockCreateCheckSessionSuccess })
          )

          const action$ = hot('--a', { a: action })
          const state$ = hot('a-a', { a: {} })
          const output$ = calibrationEpic(action$, state$)

          expectObservable(output$).toBe('--a', {
            a: Actions.createRobotCalibrationCheckSessionSuccess(
              mockRobot.name,
              Fixtures.mockCreateCheckSessionSuccess.body,
              { response: Fixtures.mockCreateCheckSessionSuccessMeta }
            ),
          })
        })
      })

      it('maps failed response to CREATE_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE', () => {
        testScheduler.run(({ hot, cold, expectObservable, flush }) => {
          mockFetchRobotApi.mockReturnValue(
            cold('r', { r: Fixtures.mockCreateCheckSessionFailure })
          )

          const action$ = hot('--a', { a: action })
          const state$ = hot('a-a', { a: {} })
          const output$ = calibrationEpic(action$, state$)

          expectObservable(output$).toBe('--a', {
            a: Actions.createRobotCalibrationCheckSessionFailure(
              mockRobot.name,
              { message: 'Failed to make a cal check sesh' },
              { response: Fixtures.mockCreateCheckSessionFailureMeta }
            ),
          })
        })
      })
    })

    describe('handles recreating check session after conflicting session deleted', () => {
      const action = Actions.deleteRobotCalibrationCheckSessionSuccess(
        mockRobot.name,
        { message: 'Session deleted successfully' },
        { ...Fixtures.mockDeleteCheckSessionSuccessMeta, recreating: true }
      )
      const expectedRequest = {
        method: 'POST',
        path: '/calibration/check/session',
      }

      it('calls POST /calibration/check/session', () => {
        testScheduler.run(({ hot, cold, expectObservable, flush }) => {
          mockFetchRobotApi.mockReturnValue(
            cold('r', { r: Fixtures.mockCreateCheckSessionSuccess })
          )

          const action$ = hot('--a', { a: action })
          const state$ = hot('a-a', { a: mockState })
          const output$ = calibrationEpic(action$, state$)

          expectObservable(output$)
          flush()

          expect(mockFetchRobotApi).toHaveBeenCalledWith(
            mockRobot,
            expectedRequest
          )
        })
      })

      it('maps successful response to CREATE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS', () => {
        testScheduler.run(({ hot, cold, expectObservable, flush }) => {
          mockFetchRobotApi.mockReturnValue(
            cold('r', { r: Fixtures.mockCreateCheckSessionSuccess })
          )

          const action$ = hot('--a', { a: action })
          const state$ = hot('a-a', { a: {} })
          const output$ = calibrationEpic(action$, state$)

          expectObservable(output$).toBe('--a', {
            a: Actions.createRobotCalibrationCheckSessionSuccess(
              mockRobot.name,
              Fixtures.mockCreateCheckSessionSuccess.body,
              {
                ...Fixtures.mockDeleteCheckSessionSuccessMeta,
                recreating: true,
                response: Fixtures.mockCreateCheckSessionSuccessMeta,
              }
            ),
          })
        })
      })

      it('maps failed response to CREATE_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE', () => {
        testScheduler.run(({ hot, cold, expectObservable, flush }) => {
          mockFetchRobotApi.mockReturnValue(
            cold('r', { r: Fixtures.mockCreateCheckSessionFailure })
          )

          const action$ = hot('--a', { a: action })
          const state$ = hot('a-a', { a: {} })
          const output$ = calibrationEpic(action$, state$)

          expectObservable(output$).toBe('--a', {
            a: Actions.createRobotCalibrationCheckSessionFailure(
              mockRobot.name,
              { message: 'Failed to make a cal check sesh' },
              {
                ...Fixtures.mockDeleteCheckSessionSuccessMeta,
                recreating: true,
                response: Fixtures.mockCreateCheckSessionFailureMeta,
              }
            ),
          })
        })
      })
    })
  })

  describe('deleteRobotCalibrationCheckSessionEpic', () => {
    describe('handles explicit DELETE CHECK SESSION', () => {
      const action = Actions.deleteRobotCalibrationCheckSession(mockRobot.name)
      const expectedRequest = {
        method: 'DELETE',
        path: '/calibration/check/session',
      }

      it('calls DELETE /calibration/check/session', () => {
        testScheduler.run(({ hot, cold, expectObservable, flush }) => {
          mockFetchRobotApi.mockReturnValue(
            cold('r', { r: Fixtures.mockDeleteCheckSessionSuccess })
          )

          const action$ = hot('--a', { a: action })
          const state$ = hot('a-a', { a: mockState })
          const output$ = calibrationEpic(action$, state$)

          expectObservable(output$)
          flush()

          expect(mockFetchRobotApi).toHaveBeenCalledWith(
            mockRobot,
            expectedRequest
          )
        })
      })

      it('maps successful response to DELETE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS', () => {
        testScheduler.run(({ hot, cold, expectObservable, flush }) => {
          mockFetchRobotApi.mockReturnValue(
            cold('r', { r: Fixtures.mockDeleteCheckSessionSuccess })
          )

          const action$ = hot('--a', { a: action })
          const state$ = hot('a-a', { a: {} })
          const output$ = calibrationEpic(action$, state$)

          expectObservable(output$).toBe('--a', {
            a: Actions.deleteRobotCalibrationCheckSessionSuccess(
              mockRobot.name,
              Fixtures.mockDeleteCheckSessionSuccess.body,
              { response: Fixtures.mockDeleteCheckSessionSuccessMeta }
            ),
          })
        })
      })

      it('maps failed response to DELETE_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE', () => {
        testScheduler.run(({ hot, cold, expectObservable, flush }) => {
          mockFetchRobotApi.mockReturnValue(
            cold('r', { r: Fixtures.mockDeleteCheckSessionFailure })
          )

          const action$ = hot('--a', { a: action })
          const state$ = hot('a-a', { a: {} })
          const output$ = calibrationEpic(action$, state$)

          expectObservable(output$).toBe('--a', {
            a: Actions.deleteRobotCalibrationCheckSessionFailure(
              mockRobot.name,
              { message: 'Failed to delete cal check sesh' },
              { response: Fixtures.mockDeleteCheckSessionFailureMeta }
            ),
          })
        })
      })
    })

    describe('handles deleting check session after conflicting session reported', () => {
      const action = Actions.createRobotCalibrationCheckSessionFailure(
        mockRobot.name,
        { message: 'Conflict with existing session. Delete to continue' },
        { response: Fixtures.mockCreateCheckSessionConflictMeta }
      )
      const expectedRequest = {
        method: 'DELETE',
        path: '/calibration/check/session',
      }

      it('calls DELETE /calibration/check/session', () => {
        testScheduler.run(({ hot, cold, expectObservable, flush }) => {
          mockFetchRobotApi.mockReturnValue(
            cold('r', { r: Fixtures.mockDeleteCheckSessionSuccess })
          )

          const action$ = hot('--a', { a: action })
          const state$ = hot('a-a', { a: mockState })
          const output$ = calibrationEpic(action$, state$)

          expectObservable(output$)
          flush()

          expect(mockFetchRobotApi).toHaveBeenCalledWith(
            mockRobot,
            expectedRequest
          )
        })
      })

      it('maps successful response to DELETE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS', () => {
        testScheduler.run(({ hot, cold, expectObservable, flush }) => {
          mockFetchRobotApi.mockReturnValue(
            cold('r', { r: Fixtures.mockDeleteCheckSessionSuccess })
          )

          const action$ = hot('--a', { a: action })
          const state$ = hot('a-a', { a: {} })
          const output$ = calibrationEpic(action$, state$)

          expectObservable(output$).toBe('--a', {
            a: Actions.deleteRobotCalibrationCheckSessionSuccess(
              mockRobot.name,
              Fixtures.mockDeleteCheckSessionSuccess.body,
              {
                response: Fixtures.mockDeleteCheckSessionSuccessMeta,
                recreating: true,
              }
            ),
          })
        })
      })

      it('maps failed response to DELETE_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE', () => {
        testScheduler.run(({ hot, cold, expectObservable, flush }) => {
          mockFetchRobotApi.mockReturnValue(
            cold('r', { r: Fixtures.mockDeleteCheckSessionFailure })
          )

          const action$ = hot('--a', { a: action })
          const state$ = hot('a-a', { a: {} })
          const output$ = calibrationEpic(action$, state$)

          expectObservable(output$).toBe('--a', {
            a: Actions.deleteRobotCalibrationCheckSessionFailure(
              mockRobot.name,
              { message: 'Failed to delete cal check sesh' },
              {
                response: Fixtures.mockDeleteCheckSessionFailureMeta,
                recreating: true,
              }
            ),
          })
        })
      })
    })
  })
})
