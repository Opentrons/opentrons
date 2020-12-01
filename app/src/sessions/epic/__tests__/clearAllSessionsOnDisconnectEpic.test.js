// @flow
import { TestScheduler } from 'rxjs/testing'

import * as DiscoverySelectors from '../../../discovery/selectors'
import * as RobotSelectors from '../../../robot/selectors'
import { mockRobot } from '../../../robot-api/__fixtures__'

import * as Actions from '../../actions'
import { sessionsEpic } from '../../epic'

jest.mock('../../../discovery/selectors')
jest.mock('../../../robot/selectors')

const mockState = { state: true }

const mockGetRobotByName: JestMockFn<[any, string], mixed> =
  DiscoverySelectors.getRobotByName

const mockGetConnectedRobotName: JestMockFn<[any], ?string> =
  RobotSelectors.getConnectedRobotName

describe('clearAllSessionsOnDisconnectEpic', () => {
  let testScheduler

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
      const action$ = hot('--a', { a: action })
      const state$ = hot('a--', { a: mockState })
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
      const action$ = hot('--a', { a: action })
      const state$ = hot('a--', { a: mockState })
      const output$ = sessionsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.clearAllSessions(mockRobot.name),
      })
    })
  })
})
