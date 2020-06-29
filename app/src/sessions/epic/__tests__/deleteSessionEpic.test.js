// @flow
import '../../../robot-api/__utils__/epic-test-mocks'

import { sessionsEpic } from '..'
import * as Fixtures from '../../__fixtures__'
import { runEpicTest, setupEpicTestMocks } from '../../../robot-api/__utils__'
import * as Actions from '../../actions'

const makeTriggerAction = robotName =>
  Actions.deleteSession(robotName, Fixtures.mockSessionId)

describe('deleteSessionEpic', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  const expectedRequest = {
    method: 'DELETE',
    path: `/sessions/${Fixtures.mockSessionId}`,
  }

  it('calls DELETE /sessions/{id}', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockDeleteSessionSuccess
    )

    runEpicTest(mocks, ({ hot, expectObservable, flush }) => {
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

  it('maps successful response to DELETE_SESSION_SUCCESS', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockDeleteSessionSuccess
    )

    runEpicTest(mocks, ({ hot, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = sessionsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.deleteSessionSuccess(
          mocks.robot.name,
          Fixtures.mockDeleteSessionSuccess.body,
          { ...mocks.meta, response: Fixtures.mockDeleteSessionSuccessMeta }
        ),
      })
    })
  })

  it('maps failed response to DELETE_SESSION_FAILURE', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockDeleteSessionFailure
    )

    runEpicTest(mocks, ({ hot, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = sessionsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.deleteSessionFailure(
          mocks.robot.name,
          Fixtures.mockSessionId,
          { errors: [{ status: 'went bad' }] },
          { ...mocks.meta, response: Fixtures.mockDeleteSessionFailureMeta }
        ),
      })
    })
  })
})
