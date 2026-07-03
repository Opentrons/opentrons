import { describe, expect, it } from 'vitest'

import { runEpicTest, setupEpicTestMocks } from '/app/redux/robot-api/__utils__'

import * as Fixtures from '../../__fixtures__'
import * as Actions from '../../actions'
import { shutdownEpic } from '../shutdownEpic'

import type { Action } from '../../../types'

describe('robotAdminEpic handles shutting down', () => {
  it('calls POST /server/shutdown', () => {
    const mocks = setupEpicTestMocks(
      robotName => Actions.shutdownRobot(robotName),
      Fixtures.mockShutdownSuccess
    )

    runEpicTest<Action>(mocks, ({ hot, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = shutdownEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(mocks.fetchRobotApi).toHaveBeenCalledWith(mocks.robot, {
        method: 'POST',
        path: '/server/shutdown',
      })
    })
  })

  it('maps successful response to SHUTDOWN_SUCCESS', () => {
    const mocks = setupEpicTestMocks(
      robotName => Actions.shutdownRobot(robotName),
      Fixtures.mockShutdownSuccess
    )

    runEpicTest<Action>(mocks, ({ hot, expectObservable }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = shutdownEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.shutdownRobotSuccess(mocks.robot.name, {
          ...mocks.meta,
          response: Fixtures.mockShutdownSuccessMeta,
        }),
      })
    })
  })

  it('maps failed response to SHUTDOWN_FAILURE', () => {
    const mocks = setupEpicTestMocks(
      robotName => Actions.shutdownRobot(robotName),
      Fixtures.mockShutdownFailure
    )

    runEpicTest<Action>(mocks, ({ hot, expectObservable }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = shutdownEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.shutdownRobotFailure(
          mocks.robot.name,
          { message: 'AH' },
          { ...mocks.meta, response: Fixtures.mockShutdownFailureMeta }
        ),
      })
    })
  })
})
