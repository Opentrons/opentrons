// @flow
import { TestScheduler } from 'rxjs/testing'

import * as RobotApiHttp from '../../../robot-api/http'
import * as DiscoverySelectors from '../../../discovery/selectors'
import * as Fixtures from '../../__fixtures__'
import * as Actions from '../../actions'
import { calibrationEpic } from '..'
import type { Observable } from 'rxjs'
import type {
  RobotHost,
  RobotApiRequestOptions,
  RobotApiResponse,
} from '../../../robot-api/types'

jest.mock('../../../robot-api/http')
jest.mock('../../../discovery/selectors')

const mockFetchRobotApi: JestMockFn<
  [RobotHost, RobotApiRequestOptions],
  Observable<RobotApiResponse>
> = RobotApiHttp.fetchRobotApi

const mockGetRobotByName: JestMockFn<[any, string], mixed> =
  DiscoverySelectors.getRobotByName

const mockRobot = Fixtures.mockRobot
const mockState = { state: true }

describe('fetchRobotCalibrationCheckSessionEpic', () => {
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

  describe('handles fetch calibration check session', () => {
    const action = Actions.fetchRobotCalibrationCheckSession(mockRobot.name)
    const expectedRequest = {
      method: 'GET',
      path: '/calibration/check/session',
    }

    it('calls GET /calibration/check/session', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        mockFetchRobotApi.mockReturnValue(
          cold('r', { r: Fixtures.mockFetchCheckSessionSuccess })
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

    it('maps successful response to FETCH_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        mockFetchRobotApi.mockReturnValue(
          cold('r', { r: Fixtures.mockFetchCheckSessionSuccess })
        )

        const action$ = hot('--a', { a: action })
        const state$ = hot('a-a', { a: {} })
        const output$ = calibrationEpic(action$, state$)

        expectObservable(output$).toBe('--a', {
          a: Actions.fetchRobotCalibrationCheckSessionSuccess(
            mockRobot.name,
            Fixtures.mockFetchCheckSessionSuccess.body,
            { response: Fixtures.mockFetchCheckSessionSuccessMeta }
          ),
        })
      })
    })

    it('maps failed response to FETCH_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        mockFetchRobotApi.mockReturnValue(
          cold('r', { r: Fixtures.mockFetchCheckSessionFailure })
        )

        const action$ = hot('--a', { a: action })
        const state$ = hot('a-a', { a: {} })
        const output$ = calibrationEpic(action$, state$)

        expectObservable(output$).toBe('--a', {
          a: Actions.fetchRobotCalibrationCheckSessionFailure(
            mockRobot.name,
            { message: 'AH' },
            { response: Fixtures.mockFetchCheckSessionFailureMeta }
          ),
        })
      })
    })

    it('maps not found response to CREATE_ROBOT_CALIBRATION_CHECK_SESSION', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        mockFetchRobotApi.mockReturnValue(
          cold('r', {
            r: {
              ...Fixtures.mockFetchCheckSessionFailure,
              status: 404,
            },
          })
        )

        const action$ = hot('--a', { a: action })
        const state$ = hot('a-a', { a: mockState })
        const output$ = calibrationEpic(action$, state$)

        expectObservable(output$).toBe('--a', {
          a: Actions.createRobotCalibrationCheckSession(mockRobot.name),
        })
      })
    })
  })
})
