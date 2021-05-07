import { TestScheduler } from 'rxjs/testing'

import * as RobotAdminSelectors from '../../../robot-admin/selectors'
import * as Actions from '../../actions'
import * as Selectors from '../../selectors'
import { robotSettingsEpic } from '..'

import type { Action, State } from '../../../types'

jest.mock('../../../robot-admin/selectors')
jest.mock('../../selectors')

const mockGetRobotRestarting = RobotAdminSelectors.getRobotRestarting as jest.MockedFunction<
  typeof RobotAdminSelectors.getRobotRestarting
>

const mockGetAllRestartRequiredRobots = Selectors.getAllRestartRequiredRobots as jest.MockedFunction<
  typeof Selectors.getAllRestartRequiredRobots
>

describe('clearRestartPathEpic', () => {
  let testScheduler: TestScheduler

  beforeEach(() => {
    mockGetAllRestartRequiredRobots.mockReturnValue([])
    mockGetRobotRestarting.mockReturnValue(false)

    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('dispatches CLEAR_RESTART_PATH on robot restart', () => {
    mockGetAllRestartRequiredRobots.mockReturnValue(['a', 'b'])
    mockGetRobotRestarting.mockReturnValue(true)

    testScheduler.run(({ hot, cold, expectObservable }) => {
      const action$ = cold<Action>('--')
      const state$ = hot<State>('-a', { a: {} } as any)
      const output$ = robotSettingsEpic(action$, state$)

      expectObservable(output$).toBe('-(ab)', {
        a: Actions.clearRestartPath('a'),
        b: Actions.clearRestartPath('b'),
      })
    })
  })
})
