import { TestScheduler } from 'rxjs/testing'

import * as DiscoverySelectors from '../../../discovery/selectors'
import * as RobotSelectors from '../../../robot/selectors'
import { mockRobot } from '../../../robot-api/__fixtures__'

import * as Actions from '../../actions'
import { sessionsEpic } from '../../epic'

import type { Action, State } from '../../../types'

jest.mock('../../../discovery/selectors')
jest.mock('../../../robot/selectors')

const mockState: State = { state: true } as any

const mockGetRobotByName = DiscoverySelectors.getRobotByName as jest.MockedFunction<
  typeof DiscoverySelectors.getRobotByName
>

const mockGetConnectedRobotName = RobotSelectors.getConnectedRobotName as jest.MockedFunction<
  typeof RobotSelectors.getConnectedRobotName
>

describe('fetchAllSessionsOnConnectEpic', () => {
  let testScheduler: TestScheduler

  beforeEach(() => {
    mockGetRobotByName.mockReturnValue(mockRobot as any)

    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('dispatches nothing robot:CONNECT_RESPONSE failure', () => {
    const action: Action = {
      type: 'robot:CONNECT_RESPONSE',
      payload: { error: { message: 'AH' } },
    } as any

    mockGetConnectedRobotName.mockReturnValue(null)

    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const action$ = hot<Action>('--a', { a: action })
      const state$ = hot<State>('a--', { a: mockState })
      const output$ = sessionsEpic(action$, state$)

      expectObservable(output$).toBe('---')
    })
  })

  it('dispatches FETCH_ALL_SESSIONS on robot:CONNECT_RESPONSE success', () => {
    const action: Action = {
      type: 'robot:CONNECT_RESPONSE',
      payload: {},
    } as any

    mockGetConnectedRobotName.mockReturnValue(mockRobot.name)

    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const action$ = hot<Action>('--a', { a: action })
      const state$ = hot<State>('a--', { a: mockState })
      const output$ = sessionsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchAllSessions(mockRobot.name),
      })
    })
  })
})
