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
import {
  mockRobot
} from '../../../robot-api/__fixtures__'

jest.mock('../../../robot-api/http')
jest.mock('../../../discovery/selectors')

const mockFetchRobotApi: JestMockFn<
  [RobotHost, RobotApiRequestOptions],
  Observable<RobotApiResponse>
> = RobotApiHttp.fetchRobotApi

const mockGetRobotByName: JestMockFn<[any, string], mixed> =
  DiscoverySelectors.getRobotByName

const mockState = { state: true }

describe('createRobotSessionEpic', () => {
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

  describe('handles explicit CREATE SESSION', () => {
    const action = Actions.createRobotSession(mockRobot.name, 'check')
    const expectedRequest = {
      method: 'POST',
      path: '/sessions',
      body: {
        data: {
          type: 'Session',
          attributes: {
            session_type: 'check',
          },
        },
      },
    }

    it('calls POST /sessions', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        mockFetchRobotApi.mockReturnValue(
          cold('r', { r: Fixtures.mockRobotSessionResponse })
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

    it('maps successful response to CREATE_ROBOT_SESSION_SUCCESS', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        mockFetchRobotApi.mockReturnValue(
          cold('r', { r: Fixtures.mockCreateSessionSuccess })
        )

        const action$ = hot('--a', { a: action })
        const state$ = hot('a-a', { a: {} })
        const output$ = sessionsEpic(action$, state$)

        expectObservable(output$).toBe('--a', {
          a: Actions.createRobotSessionSuccess(
            mockRobot.name,
            Fixtures.mockCreateSessionSuccess.body,
            { response: Fixtures.mockCreateSessionSuccessMeta }
          ),
        })
      })
    })

    it('maps failed response to CREATE_ROBOT_CHECK_SESSION_FAILURE', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        mockFetchRobotApi.mockReturnValue(
          cold('r', { r: Fixtures.mockCreateSessionFailure })
        )

        const action$ = hot('--a', { a: action })
        const state$ = hot('a-a', { a: {} })
        const output$ = sessionsEpic(action$, state$)

        expectObservable(output$).toBe('--a', {
          a: Actions.createRobotSessionFailure(
            mockRobot.name,
            { errors: [{status: 'went bad'}]},
            { response: Fixtures.mockCreateSessionFailureMeta }
          ),
        })
      })
    })
  })
})
