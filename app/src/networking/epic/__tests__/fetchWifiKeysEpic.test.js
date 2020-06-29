// @flow
import { networkingEpic } from '..'
import * as Fixtures from '../../__fixtures__'
import { runEpicTest, setupEpicTestMocks } from '../../../robot-api/__utils__'
import * as Actions from '../../actions'

const makeTriggerAction = robotName => Actions.fetchWifiKeys(robotName)

describe('networking fetch wifi keys epic', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('calls GET /wifi/keys', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockFetchWifiKeysSuccess
    )

    runEpicTest(mocks, ({ hot, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = networkingEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(mocks.fetchRobotApi).toHaveBeenCalledWith(mocks.robot, {
        method: 'GET',
        path: '/wifi/keys',
      })
    })
  })

  it('maps successful response to FETCH_WIFI_KEYS_SUCCESS', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockFetchWifiKeysSuccess
    )

    runEpicTest(mocks, ({ hot, expectObservable }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = networkingEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchWifiKeysSuccess(
          mocks.robot.name,
          Fixtures.mockFetchWifiKeysSuccess.body.keys,
          { ...mocks.meta, response: Fixtures.mockFetchWifiKeysSuccessMeta }
        ),
      })
    })
  })

  it('maps failed response to FETCH_WIFI_KEYS_FAILURE', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockFetchWifiKeysFailure
    )

    runEpicTest(mocks, ({ hot, expectObservable }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = networkingEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchWifiKeysFailure(
          mocks.robot.name,
          Fixtures.mockFetchWifiKeysFailure.body,
          { ...mocks.meta, response: Fixtures.mockFetchWifiKeysFailureMeta }
        ),
      })
    })
  })
})
