// @flow
import { TestScheduler } from 'rxjs/testing'

import { mockRobot } from '../../../robot-api/__fixtures__'
import * as RobotApiHttp from '../../../robot-api/http'
import * as DiscoverySelectors from '../../../discovery/selectors'
import * as Fixtures from '../../__fixtures__'
import * as Actions from '../../actions'
import * as Types from '../../types'
import { networkingEpic } from '..'

import type { Observable } from 'rxjs'
import type {
  RobotHost,
  RobotApiRequestOptions,
  RobotApiResponse,
} from '../../../robot-api/types'

jest.mock('../../../robot-api/http')
jest.mock('../../../discovery/selectors')
jest.mock('../../selectors')

const mockState = { state: true }

const mockFetchRobotApi: JestMockFn<
  [RobotHost, RobotApiRequestOptions],
  Observable<RobotApiResponse>
> = RobotApiHttp.fetchRobotApi

const mockGetRobotByName: JestMockFn<[any, string], mixed> =
  DiscoverySelectors.getRobotByName

describe('networking statusEpic', () => {
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

  const meta = { requestId: '1234' }
  const action: Types.FetchStatusAction = {
    ...Actions.fetchStatus(mockRobot.name),
    meta,
  }

  test('calls GET /networking/status', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      mockFetchRobotApi.mockReturnValue(
        cold('r', { r: Fixtures.mockNetworkingStatusSuccess })
      )

      const action$ = hot('--a', { a: action })
      const state$ = hot('a-a', { a: mockState })
      const output$ = networkingEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(mockGetRobotByName).toHaveBeenCalledWith(mockState, mockRobot.name)
      expect(mockFetchRobotApi).toHaveBeenCalledWith(mockRobot, {
        method: 'GET',
        path: '/networking/status',
      })
    })
  })

  test('maps successful response to FETCH_STATUS_SUCCESS', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      mockFetchRobotApi.mockReturnValue(
        cold('r', { r: Fixtures.mockNetworkingStatusSuccess })
      )

      const action$ = hot('--a', { a: action })
      const state$ = hot('a-a', { a: {} })
      const output$ = networkingEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchStatusSuccess(
          mockRobot.name,
          Fixtures.mockNetworkingStatusSuccess.body.status,
          Fixtures.mockNetworkingStatusSuccess.body.interfaces,
          { ...meta, response: Fixtures.mockNetworkingStatusSuccessMeta }
        ),
      })
    })
  })

  test('maps failed response to FETCH_STATUS_FAILURE', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      mockFetchRobotApi.mockReturnValue(
        cold('r', { r: Fixtures.mockNetworkingStatusFailure })
      )

      const action$ = hot('--a', { a: action })
      const state$ = hot('a-a', { a: {} })
      const output$ = networkingEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchStatusFailure(
          mockRobot.name,
          Fixtures.mockNetworkingStatusFailure.body,
          { ...meta, response: Fixtures.mockNetworkingStatusFailureMeta }
        ),
      })
    })
  })
})
