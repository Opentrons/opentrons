import { vi, describe, it, expect, beforeEach } from 'vitest'
import { TestScheduler } from 'rxjs/testing'

import { mockRobot } from '../../../robot-api/__fixtures__'
import * as RobotApiHttp from '../../../robot-api/http'
import * as DiscoverySelectors from '../../../discovery/selectors'
import * as Fixtures from '../../__fixtures__'
import * as Selectors from '../../selectors'
import * as Actions from '../../actions'
import type * as Types from '../../types'
import { robotSettingsEpic } from '..'

import type { Action, State } from '../../../types'
import type { RobotApiRequestMeta } from '../../../robot-api/types'

vi.mock('../../../robot-api/http')
vi.mock('../../../discovery/selectors')
vi.mock('../../selectors')

const mockState: State = { state: true } as any

describe('updateSettingEpic', () => {
  let testScheduler: TestScheduler

  beforeEach(() => {
    vi.mocked(DiscoverySelectors.getRobotByName).mockReturnValue(
      mockRobot as any
    )
    vi.mocked(Selectors.getAllRestartRequiredRobots).mockReturnValue([])

    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  const meta: RobotApiRequestMeta = { requestId: '1234' } as any
  const action: Types.UpdateSettingAction = {
    ...Actions.updateSetting(mockRobot.name, 'setting-id', true),
    meta,
  }

  it('calls POST /settings', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      vi.mocked(RobotApiHttp.fetchRobotApi).mockReturnValue(
        cold('r', { r: Fixtures.mockUpdateSettingSuccess })
      )

      const action$ = hot<Action>('--a', { a: action })
      const state$ = hot<State>('a-a', { a: mockState })
      const output$ = robotSettingsEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(DiscoverySelectors.getRobotByName).toHaveBeenCalledWith(
        mockState,
        mockRobot.name
      )
      expect(RobotApiHttp.fetchRobotApi).toHaveBeenCalledWith(mockRobot, {
        method: 'POST',
        path: '/settings',
        body: { id: 'setting-id', value: true },
      })
    })
  })

  it('maps successful response to UPDATE_SETTING_SUCCESS', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      vi.mocked(RobotApiHttp.fetchRobotApi).mockReturnValue(
        cold('r', { r: Fixtures.mockUpdateSettingSuccess })
      )

      const action$ = hot<Action>('--a', { a: action })
      const state$ = hot<State>('a-a', { a: {} } as any)
      const output$ = robotSettingsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.updateSettingSuccess(
          mockRobot.name,
          Fixtures.mockUpdateSettingSuccess.body.settings,
          Fixtures.mockUpdateSettingSuccess.body.links.restart,
          { ...meta, response: Fixtures.mockUpdateSettingSuccessMeta }
        ),
      })
    })
  })

  it('maps failed response to UPDATE_SETTING_FAILURE', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      vi.mocked(RobotApiHttp.fetchRobotApi).mockReturnValue(
        cold('r', { r: Fixtures.mockUpdateSettingFailure })
      )

      const action$ = hot<Action>('--a', { a: action })
      const state$ = hot<State>('a-a', { a: {} } as any)
      const output$ = robotSettingsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.updateSettingFailure(
          mockRobot.name,
          { message: 'AH' },
          { ...meta, response: Fixtures.mockUpdateSettingFailureMeta }
        ),
      })
    })
  })
})
