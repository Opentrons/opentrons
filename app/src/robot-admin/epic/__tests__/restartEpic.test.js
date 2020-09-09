// @flow
import { setupEpicTestMocks, runEpicTest } from '../../../robot-api/__utils__'

import * as SettingsSelectors from '../../../robot-settings/selectors'
import * as DiscoveryActions from '../../../discovery/actions'
import * as Fixtures from '../../__fixtures__'
import * as Actions from '../../actions'
import { robotAdminEpic } from '..'

import type { State } from '../../../types'

jest.mock('../../../robot-settings/selectors')

const mockGetRestartPath: JestMockFn<[State, string], string | null> =
  SettingsSelectors.getRobotRestartPath

describe('robotAdminEpic handles restarting', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('calls POST /server/restart', () => {
    const mocks = setupEpicTestMocks(
      robotName => Actions.restartRobot(robotName),
      Fixtures.mockRestartSuccess
    )

    runEpicTest(mocks, ({ hot, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = robotAdminEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(mocks.fetchRobotApi).toHaveBeenCalledWith(mocks.robot, {
        method: 'POST',
        path: '/server/restart',
      })
    })
  })

  it('calls POST with restart path in settings capabilities', () => {
    const mocks = setupEpicTestMocks(
      robotName => Actions.restartRobot(robotName),
      Fixtures.mockRestartSuccess
    )

    mockGetRestartPath.mockReturnValue('/restart')

    runEpicTest(mocks, ({ hot, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = robotAdminEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(mockGetRestartPath).toHaveBeenCalledWith(
        mocks.state,
        mocks.robot.name
      )
      expect(mocks.fetchRobotApi).toHaveBeenCalledWith(mocks.robot, {
        method: 'POST',
        path: '/restart',
      })
    })
  })

  it('maps successful response to RESTART_ROBOT_SUCCESS', () => {
    const mocks = setupEpicTestMocks(
      robotName => Actions.restartRobot(robotName),
      Fixtures.mockRestartSuccess
    )

    runEpicTest(mocks, ({ hot, expectObservable }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = robotAdminEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.restartRobotSuccess(mocks.robot.name, {
          ...mocks.meta,
          response: Fixtures.mockRestartSuccessMeta,
        }),
      })
    })
  })

  it('maps failed response to RESTART_ROBOT_FAILURE', () => {
    const mocks = setupEpicTestMocks(
      robotName => Actions.restartRobot(robotName),
      Fixtures.mockRestartFailure
    )

    runEpicTest(mocks, ({ hot, expectObservable }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = robotAdminEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.restartRobotFailure(
          mocks.robot.name,
          { message: 'AH' },
          { ...mocks.meta, response: Fixtures.mockRestartFailureMeta }
        ),
      })
    })
  })

  it('starts discovery on RESTART_SUCCESS', () => {
    const mocks = setupEpicTestMocks(robotName =>
      Actions.restartRobotSuccess(robotName, {})
    )

    runEpicTest(mocks, ({ hot, expectObservable }) => {
      const action$ = hot('-a', { a: mocks.action })
      const state$ = hot('a-', { a: mocks.state })
      const output$ = robotAdminEpic(action$, state$)

      expectObservable(output$).toBe('-a', {
        a: DiscoveryActions.startDiscovery(60000),
      })
    })
  })
})
