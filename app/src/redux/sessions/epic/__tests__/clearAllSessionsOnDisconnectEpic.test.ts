import { TestScheduler } from 'rxjs/testing'

import * as DiscoverySelectors from '../../../discovery/selectors'
import * as RobotSelectors from '../../../robot/selectors'
import { mockRobot } from '../../../robot-api/__fixtures__'

import * as Actions from '../../actions'
import { sessionsEpic } from '../../epic'

import type { Action, State } from '../../../types'

jest.mock('../../../discovery/selectors')
jest.mock('../../../robot/selectors')

const mockState = { state: true }

const mockGetRobotByName = DiscoverySelectors.getRobotByName as jest.MockedFunction<
  typeof DiscoverySelectors.getRobotByName
>

const mockGetConnectedRobotName = RobotSelectors.getConnectedRobotName as jest.MockedFunction<
  typeof RobotSelectors.getConnectedRobotName
>

describe('clearAllSessionsOnDisconnectEpic', () => {
  let testScheduler: TestScheduler

  beforeEach(() => {
    mockGetRobotByName.mockReturnValue(mockRobot as any)
    mockGetConnectedRobotName.mockReturnValue(mockRobot.name)

    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('dispatches CLEAR_ALL_SESSIONS on robot:DISCONNECT', () => {
    const action: Action = {
      type: 'robot:DISCONNECT',
      payload: {},
    } as any

    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const action$ = hot<Action>('--a', { a: action })
      const state$ = hot<State>('a--', { a: mockState } as any)
      const output$ = sessionsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.clearAllSessions(mockRobot.name),
      })
    })
  })

  it('dispatches CLEAR_ALL_SESSIONS on robot:UNEXPECTED_DISCONNECT', () => {
    const action: Action = {
      type: 'robot:UNEXPECTED_DISCONNECT',
      payload: {},
    } as any

    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const action$ = hot<Action>('--a', { a: action })
      const state$ = hot<State>('a--', { a: mockState } as any)
      const output$ = sessionsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.clearAllSessions(mockRobot.name),
      })
    })
  })
})
