import { setupEpicTestMocks, runEpicTest } from '../../../robot-api/__utils__'
import * as RobotApiHttp from '../../../robot-api/http'

import * as Fixtures from '../../__fixtures__'
import * as Actions from '../../actions'
import { sessionsEpic } from '..'

import type { Action } from '../../../types'
import { CreateSessionCommandAction } from '../../types'

jest.mock('../../../robot-api/http')

const fetchRobotApi = RobotApiHttp.fetchRobotApi as jest.MockedFunction<
  typeof RobotApiHttp.fetchRobotApi
>

const makeTriggerAction = (robotName: string): CreateSessionCommandAction =>
  Actions.createSessionCommand(robotName, '1234', Fixtures.mockSessionCommand)

describe('createSessionCommandEpic', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  const expectedCommandRequest = {
    method: 'POST',
    path: '/sessions/1234/commands/execute',
    body: {
      data: {
        command: 'calibration.jog',
        data: {
          vector: [32, 0, 0],
        },
      },
    },
  }

  const expectedFetchRequest = {
    method: 'GET',
    path: '/sessions/1234',
  }

  it('calls POST /sessions/1234/commands/execute and then GET /sessions/1234', () => {
    const mocks = setupEpicTestMocks(makeTriggerAction)

    runEpicTest<Action>(mocks, ({ hot, cold, expectObservable, flush }) => {
      fetchRobotApi.mockReturnValueOnce(
        cold('r', { r: Fixtures.mockSessionCommandsSuccess })
      )
      fetchRobotApi.mockReturnValueOnce(
        cold('r', { r: Fixtures.mockFetchSessionSuccess })
      )

      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = sessionsEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(mocks.fetchRobotApi).toHaveBeenNthCalledWith(
        1,
        mocks.robot,
        expectedCommandRequest
      )

      expect(mocks.fetchRobotApi).toHaveBeenNthCalledWith(
        2,
        mocks.robot,
        expectedFetchRequest
      )
    })
  })

  it('call does not GET /sessions/1234 if POST fails', () => {
    const mocks = setupEpicTestMocks(makeTriggerAction)

    runEpicTest<Action>(mocks, ({ hot, cold, expectObservable, flush }) => {
      fetchRobotApi.mockReturnValueOnce(
        cold('r', { r: Fixtures.mockSessionCommandsFailure })
      )

      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = sessionsEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(mocks.fetchRobotApi).toHaveBeenCalledTimes(1)
    })
  })

  it('maps successful response to CREATE_SESSION_COMMAND_SUCCESS', () => {
    const mocks = setupEpicTestMocks(makeTriggerAction)

    runEpicTest<Action>(mocks, ({ hot, cold, expectObservable, flush }) => {
      fetchRobotApi.mockReturnValueOnce(
        cold('-r', { r: Fixtures.mockSessionCommandsSuccess })
      )
      fetchRobotApi.mockReturnValueOnce(
        cold('-r', { r: Fixtures.mockFetchSessionSuccess })
      )

      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = sessionsEpic(action$, state$)

      expectObservable(output$).toBe('----a', {
        a: Actions.createSessionCommandSuccess(
          mocks.robot.name,
          mocks.action.payload.sessionId,
          Fixtures.mockFetchSessionSuccess.body,
          { ...mocks.meta, response: Fixtures.mockFetchSessionSuccessMeta }
        ),
      })
    })
  })

  it('maps failed POST response to CREATE_SESSION_COMMAND_FAILURE', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockSessionCommandsFailure
    )

    runEpicTest<Action>(mocks, ({ hot, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('a-a', { a: mocks.state })
      const output$ = sessionsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.createSessionCommandFailure(
          mocks.robot.name,
          mocks.action.payload.sessionId,
          { errors: [{ status: 'went bad' }] },
          { ...mocks.meta, response: Fixtures.mockSessionCommandsFailureMeta }
        ),
      })
    })
  })

  it('maps failed GET response to CREATE_SESSION_COMMAND_FAILURE', () => {
    const mocks = setupEpicTestMocks(makeTriggerAction)

    runEpicTest<Action>(mocks, ({ hot, cold, expectObservable, flush }) => {
      fetchRobotApi.mockReturnValueOnce(
        cold('-r', { r: Fixtures.mockSessionCommandsSuccess })
      )
      fetchRobotApi.mockReturnValueOnce(
        cold('-r', { r: Fixtures.mockFetchSessionFailure })
      )

      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('a-a', { a: mocks.state })
      const output$ = sessionsEpic(action$, state$)

      expectObservable(output$).toBe('----a', {
        a: Actions.createSessionCommandFailure(
          mocks.robot.name,
          mocks.action.payload.sessionId,
          { errors: [{ status: 'went bad' }] },
          { ...mocks.meta, response: Fixtures.mockFetchSessionFailureMeta }
        ),
      })
    })
  })
})
