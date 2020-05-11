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

describe('updateRobotSessionEpic', () => {
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

  describe('handles explicit UPDATE SESSION', () => {
    const action = Actions.updateRobotSession(
      mockRobot.name,
      '1234',
      Fixtures.mockRobotSessionUpdate
    )
    const expectedRequest = {
      method: 'POST',
      path: '/sessions/1234/commands',
      body: {
        data: {
          type: 'Command',
          attributes: {
            command: 'dosomething',
            data: {
              someData: 32,
            },
          },
        },
      },
    }

    it('calls POST /sessions/1234/commands', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        mockFetchRobotApi.mockReturnValue(
          cold('r', { r: Fixtures.mockUpdateSessionSuccess })
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

    it('maps successful response to UPDATE_ROBOT_SESSION_SUCCESS', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        mockFetchRobotApi.mockReturnValue(
          cold('r', { r: Fixtures.mockUpdateSessionSuccess })
        )

        const action$ = hot('--a', { a: action })
        const state$ = hot('a-a', { a: {} })
        const output$ = sessionsEpic(action$, state$)

        expectObservable(output$).toBe('--a', {
          a: Actions.updateRobotSessionSuccess(
            mockRobot.name,
            Fixtures.mockUpdateSessionSuccess.body,
            { response: Fixtures.mockUpdateSessionSuccessMeta }
          ),
        })
      })
    })

    it('maps failed response to UPDATE_ROBOT_SESSION_FAILURE', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        mockFetchRobotApi.mockReturnValue(
          cold('r', { r: Fixtures.mockUpdateSessionFailure })
        )

        const action$ = hot('--a', { a: action })
        const state$ = hot('a-a', { a: {} })
        const output$ = sessionsEpic(action$, state$)

        expectObservable(output$).toBe('--a', {
          a: Actions.updateRobotSessionFailure(
            mockRobot.name,
            { errors: [{ status: 'went bad' }] },
            { response: Fixtures.mockUpdateSessionFailureMeta }
          ),
        })
      })
    })
  })
})
