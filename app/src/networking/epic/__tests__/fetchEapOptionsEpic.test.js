// @flow
import { networkingEpic } from '..'
import * as Fixtures from '../../__fixtures__'
import { runEpicTest, setupEpicTestMocks } from '../../../robot-api/__utils__'
import * as Actions from '../../actions'

const makeTriggerAction = robotName => Actions.fetchEapOptions(robotName)

describe('networking fetch eap option epic', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('calls GET /wifi/eap-options', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockFetchEapOptionsSuccess
    )

    runEpicTest(mocks, ({ hot, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = networkingEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(mocks.fetchRobotApi).toHaveBeenCalledWith(mocks.robot, {
        method: 'GET',
        path: '/wifi/eap-options',
      })
    })
  })

  it('maps successful response to FETCH_EAP_OPTIONS_SUCCESS', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockFetchEapOptionsSuccess
    )

    runEpicTest(mocks, ({ hot, expectObservable }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = networkingEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchEapOptionsSuccess(
          mocks.robot.name,
          Fixtures.mockFetchEapOptionsSuccess.body.options,
          { ...mocks.meta, response: Fixtures.mockFetchEapOptionsSuccessMeta }
        ),
      })
    })
  })

  it('maps failed response to FETCH_EAP_OPTIONS_FAILURE', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockFetchEapOptionsFailure
    )

    runEpicTest(mocks, ({ hot, expectObservable }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = networkingEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchEapOptionsFailure(
          mocks.robot.name,
          Fixtures.mockFetchEapOptionsFailure.body,
          { ...mocks.meta, response: Fixtures.mockFetchEapOptionsFailureMeta }
        ),
      })
    })
  })
})
