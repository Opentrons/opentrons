// @flow
import { sessionsEpic } from '..'
import * as Fixtures from '../../__fixtures__'
import { mockRobot } from '../../../robot-api/__fixtures__'
import { runEpicTest, setupEpicTestMocks } from '../../../robot-api/__utils__'
import * as Actions from '../../actions'

const makeTriggerAction = robotName => Actions.fetchAllSessions(robotName)

describe('fetchAllSessionsEpic', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  const expectedRequest = {
    method: 'GET',
    path: '/sessions',
  }

  it('calls GET /sessions', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockFetchAllSessionsSuccess
    )

    runEpicTest(mocks, ({ hot, cold, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = sessionsEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(mocks.fetchRobotApi).toHaveBeenCalledWith(
        mocks.robot,
        expectedRequest
      )
    })
  })

  it('maps successful response to FETCH_ALL_SESSIONS_SUCCESS', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockFetchAllSessionsSuccess
    )

    runEpicTest(mocks, ({ hot, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = sessionsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchAllSessionsSuccess(
          mockRobot.name,
          Fixtures.mockFetchAllSessionsSuccess.body,
          { ...mocks.meta, response: Fixtures.mockFetchAllSessionsSuccessMeta }
        ),
      })
    })
  })

  it('maps failed response to FETCH_ALL_SESSIONS_FAILURE', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockFetchAllSessionsFailure
    )

    runEpicTest(mocks, ({ hot, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = sessionsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchAllSessionsFailure(
          mocks.robot.name,
          { errors: [{ status: 'went bad' }] },
          { ...mocks.meta, response: Fixtures.mockFetchAllSessionsFailureMeta }
        ),
      })
    })
  })
})
