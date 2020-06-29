// @flow
import '../../../robot-api/__utils__/epic-test-mocks'

import { networkingEpic } from '..'
import * as Fixtures from '../../__fixtures__'
import { runEpicTest, setupEpicTestMocks } from '../../../robot-api/__utils__'
import * as Actions from '../../actions'

const makeTriggerAction = robotName => Actions.fetchWifiList(robotName)

describe('networking wifiListEpic', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('calls GET /wifi/list', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockWifiListSuccess
    )

    runEpicTest(mocks, ({ hot, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = networkingEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(mocks.fetchRobotApi).toHaveBeenCalledWith(mocks.robot, {
        method: 'GET',
        path: '/wifi/list',
      })
    })
  })

  it('maps successful response to FETCH_WIFI_LIST_SUCCESS', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockWifiListSuccess
    )

    runEpicTest(mocks, ({ hot, expectObservable }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = networkingEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchWifiListSuccess(
          mocks.robot.name,
          Fixtures.mockWifiListSuccess.body.list,
          { ...mocks.meta, response: Fixtures.mockWifiListSuccessMeta }
        ),
      })
    })
  })

  it('maps failed response to FETCH_WIFI_LIST_FAILURE', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockWifiListFailure
    )

    runEpicTest(mocks, ({ hot, expectObservable }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = networkingEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchWifiListFailure(
          mocks.robot.name,
          Fixtures.mockWifiListFailure.body,
          { ...mocks.meta, response: Fixtures.mockWifiListFailureMeta }
        ),
      })
    })
  })
})
