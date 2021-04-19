// @flow
import { when } from 'jest-when'

import { setupEpicTestMocks, runEpicTest } from '../../../robot-api/__utils__'
import { getDiscoveredRobots } from '../../../discovery'
import * as Actions from '../../actions'
import { getNextRestartStatus } from '../../selectors'

import { trackRestartsEpic } from '../trackRestartsEpic'

jest.mock('../../../discovery/selectors')
jest.mock('../../selectors')

describe('robotAdminEpic tracks restarting state', () => {
  beforeEach(() => {
    // $FlowFixMe(mc, 2021-04-05): don't feel like typing this in Flow
    getNextRestartStatus.mockReturnValue(null)
    // $FlowFixMe(mc, 2021-04-05): don't feel like typing this in Flow
    getDiscoveredRobots.mockReturnValue([])
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('dispatches a RESTART_STATUS_CHANGED action on restart success', () => {
    const mocks = setupEpicTestMocks((robotName: string) =>
      Actions.restartRobotSuccess(robotName, {})
    )

    when(mocks.getRobotByName)
      .calledWith(mocks.state, mocks.robot.name)
      .mockReturnValue(mocks.robot)

    runEpicTest(mocks, ({ hot, expectObservable }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s--', { s: mocks.state })
      const output$ = trackRestartsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.restartStatusChanged(
          mocks.robot.name,
          'restart-pending',
          null,
          (expect.any(Date): any)
        ),
      })
    })
  })

  it('dispatches a RESTART_STATUS_CHANGED action with boot ID if present', () => {
    const mocks = setupEpicTestMocks((robotName: string) =>
      Actions.restartRobotSuccess(robotName, {})
    )

    when(mocks.getRobotByName)
      .calledWith(mocks.state, mocks.robot.name)
      .mockReturnValue({
        ...mocks.robot,
        serverHealth: { bootId: 'previous-boot-id' },
      })

    runEpicTest(mocks, ({ hot, expectObservable }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s--', { s: mocks.state })
      const output$ = trackRestartsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.restartStatusChanged(
          mocks.robot.name,
          'restart-pending',
          'previous-boot-id',
          (expect.any(Date): any)
        ),
      })
    })
  })

  it('dispatches any necessary status changes', () => {
    const mocks = setupEpicTestMocks()

    const robot1 = {
      ...mocks.robot,
      name: 'robot1',
      status: 'connectable',
      serverHealth: { bootId: 'robot-1-boot' },
    }

    const robot2 = {
      ...mocks.robot,
      name: 'robot2',
      status: 'reachable',
      serverHealth: { bootId: 'robot-2-boot' },
    }

    const robot3 = {
      ...mocks.robot,
      name: 'robot3',
      status: 'unreachable',
      serverHealth: { bootId: 'robot-3-boot' },
    }

    when(getDiscoveredRobots)
      .calledWith(mocks.state)
      .mockReturnValue([robot1, robot2, robot3])

    when(getNextRestartStatus)
      .calledWith(
        mocks.state,
        robot1.name,
        robot1.status,
        'robot-1-boot',
        expect.any(Date)
      )
      .mockReturnValue('restart-in-progress')

    when(getNextRestartStatus)
      .calledWith(
        mocks.state,
        robot2.name,
        robot2.status,
        'robot-2-boot',
        expect.any(Date)
      )
      .mockReturnValue(null)

    when(getNextRestartStatus)
      .calledWith(
        mocks.state,
        robot3.name,
        robot3.status,
        'robot-3-boot',
        expect.any(Date)
      )
      .mockReturnValue('restart-timed-out')

    runEpicTest(mocks, ({ hot, expectObservable }) => {
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
