// @flow
import '../../../robot-api/__utils__/epic-test-mocks'

import { TestScheduler } from 'rxjs/testing'

import * as DiscoverySelectors from '../../../discovery/selectors'
import { mockRobot } from '../../../robot-api/__fixtures__'
import * as RobotSelectors from '../../../robot/selectors'
import * as Actions from '../../actions'
import { sessionsEpic } from '../../epic'

jest.mock('../../../discovery/selectors')
jest.mock('../../../robot/selectors')

const mockState = { state: true }

const mockGetRobotByName: JestMockFn<[any, string], mixed> =
  DiscoverySelectors.getRobotByName

const mockGetConnectedRobotName: JestMockFn<[any], ?string> =
  RobotSelectors.getConnectedRobotName

describe('fetchAllSessionsOnConnectEpic', () => {
  let testScheduler

  beforeEach(() => {
    mockGetRobotByName.mockReturnValue(mockRobot)

    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('dispatches nothing robot:CONNECT_RESPONSE failure', () => {
    const action = {
      type: 'robot:CONNECT_RESPONSE',
      payload: { error: { message: 'AH' } },
    }

    mockGetConnectedRobotName.mockReturnValue(null)

    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const action$ = hot('--a', { a: action })
      const state$ = hot('a--', { a: mockState })
      const output$ = sessionsEpic(action$, state$)

      expectObservable(output$).toBe('---')
    })
  })

  it('dispatches FETCH_ALL_SESSIONS on robot:CONNECT_RESPONSE success', () => {
    const action = {
      type: 'robot:CONNECT_RESPONSE',
      payload: {},
    }

    mockGetConnectedRobotName.mockReturnValue(mockRobot.name)

    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const action$ = hot('--a', { a: action })
      const state$ = hot('a--', { a: mockState })
      const output$ = sessionsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchAllSessions(mockRobot.name),
      })
    })
  })
})
