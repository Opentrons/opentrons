// @flow
import { networkingEpic } from '..'
import * as Fixtures from '../../__fixtures__'
import { runEpicTest, setupEpicTestMocks } from '../../../robot-api/__utils__'
import * as Actions from '../../actions'

const makeTriggerAction = (robotName: string) =>
  Actions.postWifiDisconnect(robotName, 'network-name')

describe('networking disconnectEpic', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('calls POST /wifi/disconnect', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockNetworkingDisconnectSuccess
    )

    runEpicTest(mocks, ({ hot, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = networkingEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(mocks.fetchRobotApi).toHaveBeenCalledWith(mocks.robot, {
        method: 'POST',
        path: '/wifi/disconnect',
        body: Fixtures.mockNetworkingDisconnect,
      })
    })
  })

  it('maps successful response to POST_DISCONNECT_NETWORK_SUCCESS', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockNetworkingDisconnectSuccess
    )

    runEpicTest(mocks, ({ hot, expectObservable }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = networkingEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.postWifiDisconnectSuccess(mocks.robot.name, {
          ...mocks.meta,
          response: Fixtures.mockNetworkingDisconnectSuccessMeta,
        }),
      })
    })
  })

  it('maps failed response to POST_DISCONNECT_NETWORK_FAILURE', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockNetworkingDisconnectFailure
    )

    runEpicTest(mocks, ({ hot, expectObservable }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = networkingEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.postWifiDisconnectFailure(
          mocks.robot.name,
          Fixtures.mockNetworkingDisconnectFailure.body,
          {
            ...mocks.meta,
            response: Fixtures.mockNetworkingDisconnectFailureMeta,
          }
        ),
      })
    })
  })

  it('dispatches FETCH_WIFI_LIST on POST_WIFI_DISCONNECT_SUCCESS', () => {
    const mocks = setupEpicTestMocks(robotName =>
      Actions.postWifiDisconnectSuccess(robotName, {})
    )

    runEpicTest(mocks, ({ hot, expectObservable }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = networkingEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchWifiList(mocks.robot.name),
      })
    })
  })
})
