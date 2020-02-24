// @flow
import {
  setupEpicTestMocks,
  scheduleEpicTest,
} from '../../../robot-api/__utils__'
import * as Fixtures from '../../__fixtures__'
import * as Actions from '../../actions'
import { networkingEpic } from '..'

describe('networking fetch wifi keys epic', () => {
  let mocks

  beforeEach(() => {
    mocks = setupEpicTestMocks(robotName => Actions.fetchWifiKeys(robotName))
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('calls GET /wifi/keys', () => {
    scheduleEpicTest(
      mocks,
      Fixtures.mockFetchWifiKeysSuccess,
      ({ hot, expectObservable, flush }) => {
        const action$ = hot('--a', { a: mocks.action })
        const state$ = hot('s-s', { s: mocks.state })
        const output$ = networkingEpic(action$, state$)

        expectObservable(output$)
        flush()

        expect(mocks.fetchRobotApi).toHaveBeenCalledWith(mocks.robot, {
          method: 'GET',
          path: '/wifi/keys',
        })
      }
    )
  })

  it('maps successful response to FETCH_WIFI_KEYS_SUCCESS', () => {
    scheduleEpicTest(
      mocks,
      Fixtures.mockFetchWifiKeysSuccess,
      ({ hot, expectObservable }) => {
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
      }
    )
  })

  it('maps failed response to FETCH_WIFI_KEYS_FAILURE', () => {
    scheduleEpicTest(
      mocks,
      Fixtures.mockFetchWifiKeysFailure,
      ({ hot, expectObservable }) => {
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
      }
    )
  })
})
