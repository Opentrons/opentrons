// @flow
import { TestScheduler } from 'rxjs/testing'

import * as DiscoverySelectors from '../../../discovery/selectors'
import * as RobotSelectors from '../../../robot/selectors'
import * as Fixtures from '../../__fixtures__'

import * as Actions from '../../actions'
import { pipettesEpic } from '../../epic'

jest.mock('../../../discovery/selectors')
jest.mock('../../../robot/selectors')

const mockState = { state: true }
const { mockRobot } = Fixtures

const mockGetRobotByName: JestMockFn<[any, string], mixed> =
  DiscoverySelectors.getRobotByName

const mockGetConnectedRobotName: JestMockFn<[any], ?string> =
  RobotSelectors.getConnectedRobotName

describe('fetchPipettesOnConnectEpic', () => {
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
      const output$ = pipettesEpic(action$, state$)

      expectObservable(output$).toBe('---')
    })
  })

  it('dispatches FETCH_PIPETTES and FETCH_PIPETTE_SETTINGS on robot:CONNECT_RESPONSE success', () => {
    const action = {
      type: 'robot:CONNECT_RESPONSE',
      payload: {},
    }

    mockGetConnectedRobotName.mockReturnValue(mockRobot.name)

    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const action$ = hot('--a', { a: action })
      const state$ = hot('a--', { a: mockState })
      const output$ = pipettesEpic(action$, state$)

      expectObservable(output$).toBe('--(ab)', {
        a: Actions.fetchPipettes(mockRobot.name),
        b: Actions.fetchPipetteSettings(mockRobot.name),
      })
    })
  })
})
