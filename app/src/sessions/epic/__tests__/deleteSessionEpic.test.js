// @flow
import { TestScheduler } from 'rxjs/testing'

import * as RobotApiHttp from '../../../robot-api/http'
import * as DiscoverySelectors from '../../../discovery/selectors'
import * as Fixtures from '../../__fixtures__'
import * as Actions from '../../actions'
import { sessionsEpic } from '..'
import type { Observable } from 'rxjs'
import type {
  RobotHost,
  RobotApiRequestOptions,
  RobotApiResponse,
} from '../../../robot-api/types'
import { mockRobot } from '../../../robot-api/__fixtures__'

jest.mock('../../../robot-api/http')
jest.mock('../../../discovery/selectors')

const mockFetchRobotApi: JestMockFn<
  [RobotHost, RobotApiRequestOptions],
  Observable<RobotApiResponse>
> = RobotApiHttp.fetchRobotApi

const mockGetRobotByName: JestMockFn<[any, string], mixed> =
  DiscoverySelectors.getRobotByName

const mockState = { state: true }

describe('deleteSessionEpic', () => {
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

  describe('handles explicit DELETE SESSION', () => {
    const action = Actions.deleteSession(mockRobot.name, '1234')
    const expectedRequest = {
      method: 'DELETE',
      path: '/sessions/1234',
    }

    it('calls DELETE /sessions/1234', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        mockFetchRobotApi.mockReturnValue(
          cold('r', { r: Fixtures.mockDeleteSessionSuccess })
        )

        const action$ = hot('--a', { a: action })
        const state$ = hot('a-a', { a: mockState })
        const output$ = sessionsEpic(action$, state$)

        expectObservable(output$)
        flush()

        expect(mockFetchRobotApi).toHaveBeenCalledWith(
          mockRobot,
          expectedRequest
        )
      })
    })

    it('maps successful response to DELETE_SESSION_SUCCESS', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        mockFetchRobotApi.mockReturnValue(
          cold('r', { r: Fixtures.mockDeleteSessionSuccess })
        )

        const action$ = hot('--a', { a: action })
        const state$ = hot('a-a', { a: {} })
        const output$ = sessionsEpic(action$, state$)

        expectObservable(output$).toBe('--a', {
          a: Actions.deleteSessionSuccess(
            mockRobot.name,
            Fixtures.mockDeleteSessionSuccess.body,
            { response: Fixtures.mockDeleteSessionSuccessMeta }
          ),
        })
      })
    })

    it('maps failed response to DELETE_ROBOT_CHECK_SESSION_FAILURE', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        mockFetchRobotApi.mockReturnValue(
          cold('r', { r: Fixtures.mockDeleteSessionFailure })
        )

        const action$ = hot('--a', { a: action })
        const state$ = hot('a-a', { a: {} })
        const output$ = sessionsEpic(action$, state$)

        expectObservable(output$).toBe('--a', {
          a: Actions.deleteSessionFailure(
            mockRobot.name,
            { errors: [{ status: 'went bad' }] },
            { response: Fixtures.mockDeleteSessionFailureMeta }
          ),
        })
      })
    })
  })
})
