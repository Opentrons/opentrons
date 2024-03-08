import { vi, describe, it, expect, beforeEach } from 'vitest'
import { TestScheduler } from 'rxjs/testing'

import { mockRobot } from '../../../robot-api/__fixtures__'
import * as RobotApiHttp from '../../../robot-api/http'
import * as DiscoverySelectors from '../../../discovery/selectors'
import * as Fixtures from '../../__fixtures__'
import * as Actions from '../../actions'
import * as Types from '../../types'
import { robotControlsEpic } from '..'

import type { Action, State } from '../../../types'

vi.mock('../../../robot-api/http')
vi.mock('../../../discovery/selectors')

const mockState: State = { state: true } as any

describe('homeEpic', () => {
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
  const action: Types.HomeAction = {
    ...Actions.home(mockRobot.name, 'robot'),
    meta,
  }

  it('calls POST /robot/home with target: robot', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      vi.mocked(RobotApiHttp.fetchRobotApi).mockReturnValue(
        cold('r', { r: Fixtures.mockHomeSuccess })
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
        method: 'POST',
        path: '/robot/home',
        body: { target: 'robot' },
      })
    })
  })

  it('calls POST /robot/home with target: pipette', () => {
    const action: Types.HomeAction = {
      ...Actions.home(mockRobot.name, 'pipette', 'right'),
      meta,
    }
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      vi.mocked(RobotApiHttp.fetchRobotApi).mockReturnValue(
        cold('r', { r: Fixtures.mockHomeSuccess })
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
        method: 'POST',
        path: '/robot/home',
        body: { target: 'pipette', mount: 'right' },
      })
    })
  })

  it('maps successful response to HOME_SUCCESS', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      vi.mocked(RobotApiHttp.fetchRobotApi).mockReturnValue(
        cold('r', { r: Fixtures.mockHomeSuccess })
      )

      const action$ = hot<Action>('--a', { a: action })
      const state$ = hot<State>('a-a', { a: {} } as any)
      const output$ = robotControlsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.homeSuccess(mockRobot.name, {
          ...meta,
          response: Fixtures.mockHomeSuccessMeta,
        }),
      })
    })
  })

  it('maps failed response to HOME_FAILURE', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      vi.mocked(RobotApiHttp.fetchRobotApi).mockReturnValue(
        cold('r', { r: Fixtures.mockHomeFailure })
      )

      const action$ = hot<Action>('--a', { a: action })
      const state$ = hot<State>('a-a', { a: {} } as any)
      const output$ = robotControlsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.homeFailure(
          mockRobot.name,
          { message: 'AH' },
          { ...meta, response: Fixtures.mockHomeFailureMeta }
        ),
      })
    })
  })
})
