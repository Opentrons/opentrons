// @flow
import { setupEpicTestMocks, runEpicTest } from '../../../robot-api/__utils__'

import * as Fixtures from '../../__fixtures__'
import * as Actions from '../../actions'
import { sessionsEpic } from '..'

const makeTriggerCommandResponseSuccessAction = robotName =>
  Actions.createSessionCommandSuccess(
    robotName,
    'mysessionid',
    Fixtures.mockSessionCommandResponse,
    {}
  )

const makeTriggerCommandResponseFailureAction = robotName =>
  Actions.createSessionCommandFailure(
    robotName,
    'mysessionid',
    Fixtures.mockSessionCommandsFailure.body,
    {}
  )

describe('commandResponseSessionEpic', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('dispatches sessions:FETCH_SESSION on sessions:CREATE_SESSION_COMMAND_SUCCESS', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerCommandResponseSuccessAction,
      Fixtures.mockSessionCommandsSuccess
    )

    runEpicTest(mocks, ({ hot, cold, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s--', { s: mocks.state })
      const output$ = sessionsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchSession(
          mocks.robot.name,
          mocks.action.payload.sessionId
        ),
      })
    })
  })

  it('does nothing on sessions:CREATE_SESSION_COMMAND_FAILURE', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerCommandResponseFailureAction,
      Fixtures.mockSessionCommandsSuccess
    )

    runEpicTest(mocks, ({ hot, cold, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s--', { s: mocks.state })
      const output$ = sessionsEpic(action$, state$)

      expectObservable(output$).toBe('---')
    })
  })
})
