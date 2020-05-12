// @flow
import { setupEpicTestMocks, runEpicTest } from '../../../robot-api/__utils__'

import * as Fixtures from '../../__fixtures__'
import * as Actions from '../../actions'
import { sessionsEpic } from '..'

const makeTriggerAction = robotName =>
  Actions.createSessionCommand(robotName, '1234', Fixtures.mockSessionCommand)

describe('createSessionCommandEpic', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  const expectedRequest = {
    method: 'POST',
    path: '/sessions/1234/commands',
    body: {
      data: {
        type: 'Command',
        attributes: {
          command: 'dosomething',
          data: {
            someData: 32,
          },
        },
      },
    },
  }

  it('calls POST /sessions/1234/commands', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockUpdateSessionSuccess
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

  it('maps successful response to CREATE_SESSION_COMMAND_SUCCESS', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockUpdateSessionSuccess
    )

    runEpicTest(mocks, ({ hot, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = sessionsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.createSessionCommandSuccess(
          mocks.robot.name,
          mocks.action.payload.sessionId,
          Fixtures.mockUpdateSessionSuccess.body,
          { ...mocks.meta, response: Fixtures.mockUpdateSessionSuccessMeta }
        ),
      })
    })
  })

  it('maps failed response to CREATE_SESSION_COMMAND_FAILURE', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockUpdateSessionFailure
    )

    runEpicTest(mocks, ({ hot, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('a-a', { a: mocks.state })
      const output$ = sessionsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.createSessionCommandFailure(
          mocks.robot.name,
          mocks.action.payload.sessionId,
          { errors: [{ status: 'went bad' }] },
          { ...mocks.meta, response: Fixtures.mockUpdateSessionFailureMeta }
        ),
      })
    })
  })
})
