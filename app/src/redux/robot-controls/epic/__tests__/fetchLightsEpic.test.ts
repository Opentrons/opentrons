import { vi, describe, it, expect, beforeEach } from 'vitest'
import { TestScheduler } from 'rxjs/testing'

import { mockRobot } from '../../../robot-api/__fixtures__'
import * as RobotApiHttp from '../../../robot-api/http'
import * as DiscoverySelectors from '../../../discovery/selectors'
import * as Fixtures from '../../__fixtures__'
import * as Actions from '../../actions'
import { robotControlsEpic } from '..'

import type * as Types from '../../types'
import type { Action, State } from '../../../types'

vi.mock('../../../robot-api/http')
vi.mock('../../../discovery/selectors')

const mockState: State = { state: true } as any

describe('fetchLightsEpic', () => {
  let testScheduler: TestScheduler

  beforeEach(() => {
    vi.mocked(DiscoverySelectors.getRobotByName).mockReturnValue(
      mockRobot as any
    )

    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  const meta = { requestId: '1234' }
  const action: Types.FetchLightsAction = {
    ...Actions.fetchLights(mockRobot.name),
    meta,
  }

  it('calls GET /robot/lights', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      vi.mocked(RobotApiHttp.fetchRobotApi).mockReturnValue(
        cold('r', { r: Fixtures.mockFetchLightsSuccess })
      )

      const action$ = hot<Action>('--a', { a: action })
      const state$ = hot<State>('a-a', { a: mockState })
      const output$ = robotControlsEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(DiscoverySelectors.getRobotByName).toHaveBeenCalledWith(
        mockState,
        mockRobot.name
      )
      expect(RobotApiHttp.fetchRobotApi).toHaveBeenCalledWith(mockRobot, {
        method: 'GET',
        path: '/robot/lights',
      })
    })
  })

  it('maps successful response to FETCH_LIGHTS_SUCCESS', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      vi.mocked(RobotApiHttp.fetchRobotApi).mockReturnValue(
        cold('r', { r: Fixtures.mockFetchLightsSuccess })
      )

      const action$ = hot<Action>('--a', { a: action })
      const state$ = hot<State>('a-a', { a: {} } as any)
      const output$ = robotControlsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchLightsSuccess(
          mockRobot.name,
          Fixtures.mockFetchLightsSuccess.body.on,
          { ...meta, response: Fixtures.mockFetchLightsSuccessMeta }
        ),
      })
    })
  })

  it('maps failed response to FETCH_LIGHTS_FAILURE', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      vi.mocked(RobotApiHttp.fetchRobotApi).mockReturnValue(
        cold('r', { r: Fixtures.mockFetchLightsFailure })
      )

      const action$ = hot<Action>('--a', { a: action })
      const state$ = hot<State>('a-a', { a: {} } as any)
      const output$ = robotControlsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchLightsFailure(
          mockRobot.name,
          { message: 'AH' },
          { ...meta, response: Fixtures.mockFetchLightsFailureMeta }
        ),
      })
    })
  })
})
