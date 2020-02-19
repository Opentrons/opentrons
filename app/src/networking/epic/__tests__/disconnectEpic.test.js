// @flow
import { TestScheduler } from 'rxjs/testing'

import { mockRobot } from '../../../robot-api/__fixtures__'
import * as RobotApiHttp from '../../../robot-api/http'
import * as DiscoverySelectors from '../../../discovery/selectors'
import * as Fixtures from '../../__fixtures__'
import * as Actions from '../../actions'
import * as Constants from '../../constants'
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

describe('networking disconnectEpic', () => {
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
  const action: Types.PostDisconnectNetworkAction = {
    ...Actions.postDisconnectNetwork(
      mockRobot.name,
      Fixtures.mockNetworkingDisconnect.ssid
    ),
    meta,
  }

  test(`calls POST ${Constants.DISCONNECT_PATH}`, () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      mockFetchRobotApi.mockReturnValue(
        cold('r', { r: Fixtures.mockNetworkingDisconnectSuccess })
      )

      const action$ = hot('--a', { a: action })
      const state$ = hot('a-a', { a: mockState })
      const output$ = networkingEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(mockGetRobotByName).toHaveBeenCalledWith(mockState, mockRobot.name)
      expect(mockFetchRobotApi).toHaveBeenCalledWith(mockRobot, {
        method: 'POST',
        path: Constants.DISCONNECT_PATH,
        body: Fixtures.mockNetworkingDisconnect,
      })
    })
  })

  test(`maps successful response to ${Constants.POST_DISCONNECT_NETWORK_SUCCESS}`, () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      mockFetchRobotApi.mockReturnValue(
        cold('r', { r: Fixtures.mockNetworkingDisconnectSuccess })
      )

      const action$ = hot('--a', { a: action })
      const state$ = hot('a-a', { a: {} })
      const output$ = networkingEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.postDisconnectNetworkSuccess(mockRobot.name, {
          ...meta,
          response: Fixtures.mockNetworkingDisconnectSuccessMeta,
        }),
      })
    })
  })

  test(`maps failed response to ${Constants.POST_DISCONNECT_NETWORK_FAILURE}`, () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      mockFetchRobotApi.mockReturnValue(
        cold('r', { r: Fixtures.mockNetworkingDisconnectFailure })
      )

      const action$ = hot('--a', { a: action })
      const state$ = hot('a-a', { a: {} })
      const output$ = networkingEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.postDisconnectNetworkFailure(
          mockRobot.name,
          Fixtures.mockNetworkingDisconnectFailure.body,
          { ...meta, response: Fixtures.mockNetworkingDisconnectFailureMeta }
        ),
      })
    })
  })
})
