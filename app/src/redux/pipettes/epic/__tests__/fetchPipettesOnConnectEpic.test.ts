import { TestScheduler } from 'rxjs/testing'

import * as DiscoverySelectors from '../../../discovery/selectors'
import * as RobotSelectors from '../../../robot/selectors'
import * as Fixtures from '../../__fixtures__'

import * as Actions from '../../actions'
import { pipettesEpic } from '../../epic'

import type { Action, State } from '../../../types'

jest.mock('../../../discovery/selectors')
jest.mock('../../../robot/selectors')

const mockState: State = { state: true } as any
const { mockRobot } = Fixtures

const mockGetRobotByName = DiscoverySelectors.getRobotByName as jest.MockedFunction<
  typeof DiscoverySelectors.getRobotByName
>

const mockGetConnectedRobotName = RobotSelectors.getConnectedRobotName as jest.MockedFunction<
  typeof RobotSelectors.getConnectedRobotName
>

describe('fetchPipettesOnConnectEpic', () => {
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
      const output$ = pipettesEpic(action$, state$)

      expectObservable(output$).toBe('---')
    })
  })

  it('dispatches FETCH_PIPETTES and FETCH_PIPETTE_SETTINGS on robot:CONNECT_RESPONSE success', () => {
    const action: Action = {
      type: 'robot:CONNECT_RESPONSE',
      payload: {},
    } as any

    mockGetConnectedRobotName.mockReturnValue(mockRobot.name)

    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const action$ = hot<Action>('--a', { a: action })
      const state$ = hot<State>('a--', { a: mockState })
      const output$ = pipettesEpic(action$, state$)

      expectObservable(output$).toBe('--(ab)', {
        a: Actions.fetchPipettes(mockRobot.name),
        b: Actions.fetchPipetteSettings(mockRobot.name),
      })
    })
  })
})
