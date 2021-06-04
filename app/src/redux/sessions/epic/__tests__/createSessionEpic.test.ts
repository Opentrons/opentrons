import { setupEpicTestMocks, runEpicTest } from '../../../robot-api/__utils__'

import * as Fixtures from '../../__fixtures__'
import * as Actions from '../../actions'
import { sessionsEpic } from '..'

import type { Action } from '../../../types'

const makeTriggerAction = (robotName: string) =>
  Actions.createSession(robotName, 'calibrationCheck')

describe('createSessionEpic', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  const expectedRequest = {
    method: 'POST',
    path: '/sessions',
    body: {
      data: {
        sessionType: 'calibrationCheck',
        createParams: {},
      },
    },
  }

  it('calls POST /sessions', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockCreateSessionSuccess
    )

    runEpicTest<Action>(mocks, ({ hot, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('a-a', { a: mocks.state })
      const output$ = sessionsEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(mocks.fetchRobotApi).toHaveBeenCalledWith(
        mocks.robot,
        expectedRequest
      )
    })
  })

  it('maps successful response to CREATE_SESSION_SUCCESS', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockCreateSessionSuccess
    )

    runEpicTest<Action>(mocks, ({ hot, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = sessionsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.createSessionSuccess(
          mocks.robot.name,
          Fixtures.mockCreateSessionSuccess.body,
          { ...mocks.meta, response: Fixtures.mockCreateSessionSuccessMeta }
        ),
      })
    })
  })

  it('maps failed response to CREATE_SESSION_FAILURE', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockCreateSessionFailure
    )

    runEpicTest<Action>(mocks, ({ hot, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = sessionsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.createSessionFailure(
          mocks.robot.name,
          { errors: [{ status: 'went bad' }] },
          { ...mocks.meta, response: Fixtures.mockCreateSessionFailureMeta }
        ),
      })
    })
  })
})
