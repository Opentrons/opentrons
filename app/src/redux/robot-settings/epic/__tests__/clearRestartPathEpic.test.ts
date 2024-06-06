import { vi, describe, it, expect, beforeEach } from 'vitest'
import { TestScheduler } from 'rxjs/testing'

import * as RobotAdminSelectors from '../../../robot-admin/selectors'
import * as Actions from '../../actions'
import * as Selectors from '../../selectors'
import { robotSettingsEpic } from '..'

import type { Action, State } from '../../../types'

vi.mock('../../../robot-admin/selectors')
vi.mock('../../selectors')

describe('clearRestartPathEpic', () => {
  let testScheduler: TestScheduler

  beforeEach(() => {
    vi.mocked(Selectors.getAllRestartRequiredRobots).mockReturnValue([])
    vi.mocked(RobotAdminSelectors.getRobotRestarting).mockReturnValue(false)

    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  it('dispatches CLEAR_RESTART_PATH on robot restart', () => {
    vi.mocked(Selectors.getAllRestartRequiredRobots).mockReturnValue(['a', 'b'])
    vi.mocked(RobotAdminSelectors.getRobotRestarting).mockReturnValue(true)

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
