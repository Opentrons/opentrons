import { TestScheduler } from 'rxjs/testing'

import * as DiscoverySelectors from '../../../discovery/selectors'
import * as RobotSelectors from '../../../robot/selectors'
import { mockRobot } from '../../../robot-api/__fixtures__'

import * as Actions from '../../actions'
import { sessionsEpic } from '../../epic'

import type { Observable } from 'rxjs'
import type { State } from '../../../types'

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
    mockGetRobotByName.mockReturnValue(mockRobot)
    mockGetConnectedRobotName.mockReturnValue(mockRobot.name)

    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('dispatches CLEAR_ALL_SESSIONS on robot:DISCONNECT', () => {
    const action = {
      type: 'robot:DISCONNECT',
      payload: {},
    }

    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const action$ = hot<Action>('--a', { a: action })
      const state$ = hot<State>('a--', { a: mockState })
      const output$ = sessionsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.clearAllSessions(mockRobot.name),
      })
    })
  })

  it('dispatches CLEAR_ALL_SESSIONS on robot:UNEXPECTED_DISCONNECT', () => {
    const action = {
      type: 'robot:UNEXPECTED_DISCONNECT',
      payload: {},
    }

    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const action$ = hot<Action>('--a', { a: action })
      const state$ = hot<State>('a--', { a: mockState })
      const output$ = sessionsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.clearAllSessions(mockRobot.name),
      })
    })
  })
})
