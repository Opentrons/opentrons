import { vi, describe, it, expect, beforeEach } from 'vitest'
import { when } from 'vitest-when'

import { setupEpicTestMocks, runEpicTest } from '../../../robot-api/__utils__'
import * as Actions from '../../actions'
import * as robotAdminSelectors from '../../selectors'
import * as discoverySelectors from '../../../discovery/selectors'

import { trackRestartsEpic } from '../trackRestartsEpic'

import type {
  ConnectivityStatus,
  DiscoveredRobot,
} from '../../../discovery/types'
import type { Action } from '../../../types'

vi.mock('../../../discovery/selectors')
vi.mock('../../selectors')

describe('robotAdminEpic tracks restarting state', () => {
  beforeEach(() => {
    vi.mocked(robotAdminSelectors.getNextRestartStatus).mockReturnValue(null)
    vi.mocked(discoverySelectors.getDiscoveredRobots).mockReturnValue([])
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
      const output$ = trackRestartsEpic(action$, state$)

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
      const output$ = trackRestartsEpic(action$, state$)

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

  it('dispatches any necessary status changes', () => {
    const mocks = setupEpicTestMocks<Action>()

    const robot1 = {
      ...mocks.robot,
      name: 'robot1',
      status: 'connectable' as ConnectivityStatus,
      serverHealth: { bootId: 'robot-1-boot' },
    }

    const robot2 = {
      ...mocks.robot,
      name: 'robot2',
      status: 'reachable' as ConnectivityStatus,
      serverHealth: { bootId: 'robot-2-boot' },
    }

    const robot3 = {
      ...mocks.robot,
      name: 'robot3',
      status: 'unreachable' as ConnectivityStatus,
      serverHealth: { bootId: 'robot-3-boot' },
    }

    when(vi.mocked(discoverySelectors.getDiscoveredRobots))
      .calledWith(mocks.state)
      .thenReturn([
        robot1 as DiscoveredRobot,
        robot2 as DiscoveredRobot,
        robot3 as DiscoveredRobot,
      ])

    when(vi.mocked(robotAdminSelectors.getNextRestartStatus))
      .calledWith(
        mocks.state,
        robot1.name,
        robot1.status,
        'robot-1-boot',
        expect.any(Date)
      )
      .thenReturn('restart-in-progress')

    when(vi.mocked(robotAdminSelectors.getNextRestartStatus))
      .calledWith(
        mocks.state,
        robot2.name,
        robot2.status,
        'robot-2-boot',
        expect.any(Date)
      )
      .thenReturn(null)

    when(vi.mocked(robotAdminSelectors.getNextRestartStatus))
      .calledWith(
        mocks.state,
        robot3.name,
        robot3.status,
        'robot-3-boot',
        expect.any(Date)
      )
      .thenReturn('restart-timed-out')

    runEpicTest<Action>(mocks, ({ hot, expectObservable }) => {
      const action$ = hot('--')
      const state$ = hot('-s', { s: mocks.state })
      const output$ = trackRestartsEpic(action$, state$)

      expectObservable(output$).toBe('-(ab)', {
        a: Actions.restartStatusChanged(robot1.name, 'restart-in-progress'),
        b: Actions.restartStatusChanged(robot3.name, 'restart-timed-out'),
      })
    })
  })
})
