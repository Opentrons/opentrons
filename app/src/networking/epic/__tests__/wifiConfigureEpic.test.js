// @flow
import { TestScheduler } from 'rxjs/testing'

import { mockRobot } from '../../../robot-api/__fixtures__'
import * as RobotApiHttp from '../../../robot-api/http'
import * as Discovery from '../../../discovery'
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
  Discovery.getRobotByName

describe('networking wifiConfigureEpic', () => {
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
  const action: Types.PostWifiConfigureAction = {
    ...Actions.postWifiConfigure(mockRobot.name, {
      ssid: 'network-name',
      psk: 'network-password',
    }),
    meta,
  }

  it('calls POST /wifi/configure with options', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      mockFetchRobotApi.mockReturnValue(
        cold('r', { r: Fixtures.mockWifiConfigureSuccess })
      )

      const action$ = hot('--a', { a: action })
      const state$ = hot('a-a', { a: mockState })
      const output$ = networkingEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(mockGetRobotByName).toHaveBeenCalledWith(mockState, mockRobot.name)
      expect(mockFetchRobotApi).toHaveBeenCalledWith(mockRobot, {
        method: 'POST',
        path: '/wifi/configure',
        body: { ssid: 'network-name', psk: 'network-password' },
      })
    })
  })

  it('maps successful response to FETCH_WIFI_CONFIGURE_SUCCESS', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      mockFetchRobotApi.mockReturnValue(
        cold('r', { r: Fixtures.mockWifiConfigureSuccess })
      )

      const action$ = hot('--a', { a: action })
      const state$ = hot('a-a', { a: {} })
      const output$ = networkingEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.postWifiConfigureSuccess(
          mockRobot.name,
          Fixtures.mockWifiConfigureSuccess.body.ssid,
          { ...meta, response: Fixtures.mockWifiConfigureSuccessMeta }
        ),
      })
    })
  })

  it('maps failed response to FETCH_WIFI_CONFIGURE_FAILURE', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      mockFetchRobotApi.mockReturnValue(
        cold('r', { r: Fixtures.mockWifiConfigureFailure })
      )

      const action$ = hot('--a', { a: action })
      const state$ = hot('a-a', { a: {} })
      const output$ = networkingEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.postWifiConfigureFailure(
          mockRobot.name,
          Fixtures.mockWifiConfigureFailure.body,
          { ...meta, response: Fixtures.mockWifiConfigureFailureMeta }
        ),
      })
    })
  })

  it('dispatches FETCH_WIFI_LIST and START_DISCOVERY on success', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const action$ = hot('--a', {
        a: Actions.postWifiConfigureSuccess(mockRobot.name, 'network-name', {}),
      })
      const state$ = hot('a-a', { a: {} })
      const output$ = networkingEpic(action$, state$)

      expectObservable(output$).toBe('--(ab)', {
        a: Actions.fetchWifiList(mockRobot.name),
        b: Discovery.startDiscovery(),
      })
    })
  })
})
