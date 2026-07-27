import { beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { runEpicTest, setupEpicTestMocks } from '/app/redux/robot-api/__utils__'

import * as Actions from '../../actions'
import { trackRestartBeginEpic } from '../trackRestartsEpic'

import type { Action } from '../../../types'

describe('trackRestartBeginEpic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('dispatches a RESTART_STATUS_CHANGED action on restart success', () => {
    const mocks = setupEpicTestMocks<Action>((robotName: string) =>
      Actions.restartRobotSuccess(robotName, {} as any)
    )

    when(mocks.getRobotByName)
      .calledWith((mocks as any).state, (mocks as any).robot.name)
      .thenReturn(mocks.robot as any)

    runEpicTest<Action>(mocks, ({ hot, expectObservable }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s--', { s: mocks.state })
      const output$ = trackRestartBeginEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.restartStatusChanged(
          mocks.robot.name,
          'restart-pending',
          null,
          expect.any(Date)
        ),
      })
    })
  })

  it('dispatches a RESTART_STATUS_CHANGED action with boot ID if present', () => {
    const mocks = setupEpicTestMocks<Action>((robotName: string) =>
      Actions.restartRobotSuccess(robotName, {} as any)
    )

    when(mocks.getRobotByName)
      .calledWith((mocks as any).state, (mocks as any).robot.name)
      .thenReturn({
        ...mocks.robot,
        serverHealth: { bootId: 'previous-boot-id' },
      } as any)

    runEpicTest<Action>(mocks, ({ hot, expectObservable }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s--', { s: mocks.state })
      const output$ = trackRestartBeginEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.restartStatusChanged(
          mocks.robot.name,
          'restart-pending',
          'previous-boot-id',
          expect.any(Date)
        ),
      })
    })
  })
})
