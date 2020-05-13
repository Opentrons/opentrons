// @flow
import { TestScheduler } from 'rxjs/testing'

import * as RobotApiHttp from '../../../robot-api/http'
import { mockRequestMeta } from '../../../robot-api/__fixtures__'
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

describe('deleteRobotCalibrationCheckSessionEpic', () => {
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
            { message: 'AH' },
            { response: Fixtures.mockDeleteCheckSessionFailureMeta }
          ),
        })
      })
    })

    it('maps success response with recreate to CREATE_ROBOT_CALIBRATION_CHECK_SESSION', () => {
      const recreateAction = Actions.deleteRobotCalibrationCheckSession(
        mockRobot.name,
        true,
        { requestId: mockRequestMeta.requestId }
      )

      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        mockFetchRobotApi.mockReturnValue(
          cold('r', { r: Fixtures.mockDeleteCheckSessionSuccess })
        )

        const action$ = hot('--a', { a: recreateAction })
        const state$ = hot('a-a', { a: {} })
        const output$ = calibrationEpic(action$, state$)

        expectObservable(output$).toBe('--a', {
          a: Actions.createRobotCalibrationCheckSession(
            mockRobot.name,
            mockRequestMeta
          ),
        })
      })
    })
  })
})
