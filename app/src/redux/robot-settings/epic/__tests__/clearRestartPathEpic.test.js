// @flow
import { TestScheduler } from 'rxjs/testing'

import * as RobotAdminSelectors from '../../../robot-admin/selectors'
import * as Actions from '../../actions'
import * as Selectors from '../../selectors'
import { robotSettingsEpic } from '..'

import type { State } from '../../../types'

jest.mock('../../../robot-admin/selectors')
jest.mock('../../selectors')

const mockGetRobotRestarting: JestMockFn<[State, string], mixed> =
  RobotAdminSelectors.getRobotRestarting

const mockGetAllRestartRequiredRobots: JestMockFn<[State], Array<string>> =
  Selectors.getAllRestartRequiredRobots

describe('clearRestartPathEpic', () => {
  let testScheduler

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
      const action$ = cold('--')
      const state$ = hot('-a', { a: {} })
      const output$ = robotSettingsEpic(action$, state$)

      expectObservable(output$).toBe('-(ab)', {
        a: Actions.clearRestartPath('a'),
        b: Actions.clearRestartPath('b'),
      })
    })
  })
})
