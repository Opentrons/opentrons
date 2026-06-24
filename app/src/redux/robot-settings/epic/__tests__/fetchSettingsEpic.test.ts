import { TestScheduler } from 'rxjs/testing'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { robotSettingsEpic } from '..'
import * as Fixtures from '../../__fixtures__'
import * as DiscoverySelectors from '../../../discovery/selectors'
import { mockRobot } from '../../../robot-api/__fixtures__'
import * as RobotApiHttp from '../../../robot-api/http'
import * as Actions from '../../actions'

import type { RobotApiRequestMeta } from '../../../robot-api/types'
import type { Action, State } from '../../../types'
import type * as Types from '../../types'

vi.mock('../../../robot-api/http')
vi.mock('../../../discovery/selectors')

const mockState: State = { state: true } as any

describe('fetchSettingsEpic', () => {
  let testScheduler: TestScheduler

  beforeEach(() => {
    vi.mocked(DiscoverySelectors.getRobotByName).mockReturnValue(
      mockRobot as any
    )

    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  const meta: RobotApiRequestMeta = { requestId: '1234' } as any
  const action: Types.FetchSettingsAction = {
    ...Actions.fetchSettings(mockRobot.name),
    meta,
  }

  it('calls GET /settings', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      vi.mocked(RobotApiHttp.fetchRobotApi).mockReturnValue(
        cold('r', { r: Fixtures.mockFetchSettingsSuccess })
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
        method: 'GET',
        path: '/settings',
      })
    })
  })

  it('maps successful response to FETCH_SETTINGS_SUCCESS', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      vi.mocked(RobotApiHttp.fetchRobotApi).mockReturnValue(
        cold('r', { r: Fixtures.mockFetchSettingsSuccess })
      )

      const action$ = hot<Action>('--a', { a: action })
      const state$ = hot<State>('a-a', { a: {} } as any)
      const output$ = robotSettingsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchSettingsSuccess(
          mockRobot.name,
          Fixtures.mockFetchSettingsSuccess.body.settings,
          Fixtures.mockFetchSettingsSuccess.body.links.restart,
          { ...meta, response: Fixtures.mockFetchSettingsSuccessMeta }
        ),
      })
    })
  })

  it('maps failed response to FETCH_SETTINGS_FAILURE', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      vi.mocked(RobotApiHttp.fetchRobotApi).mockReturnValue(
        cold('r', { r: Fixtures.mockFetchSettingsFailure })
      )

      const action$ = hot<Action>('--a', { a: action })
      const state$ = hot<State>('a-a', { a: {} } as any)
      const output$ = robotSettingsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchSettingsFailure(
          mockRobot.name,
          { message: 'AH' },
          { ...meta, response: Fixtures.mockFetchSettingsFailureMeta }
        ),
      })
    })
  })
})
