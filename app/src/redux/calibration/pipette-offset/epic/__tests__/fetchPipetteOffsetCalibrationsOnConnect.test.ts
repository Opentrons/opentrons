import { TestScheduler } from 'rxjs/testing'
import { selectors as RobotSelectors } from '../../../../robot'
import * as DiscoverySelectors from '../../../../discovery/selectors'
import * as Actions from '../../actions'
import { pipetteOffsetCalibrationsEpic } from '..'

import type { Action, State } from '../../../../types'

jest.mock('../../actions')
jest.mock('../../../../robot/selectors')
jest.mock('../../../../discovery/selectors')

const mockState = { state: true }
const mockRobot = { name: 'robot', ip: '127.0.0.1', port: 31950 } as any

const mockGetRobotByName = DiscoverySelectors.getRobotByName as jest.MockedFunction<
  typeof DiscoverySelectors.getRobotByName
>

const mockGetConnectedRobotName = RobotSelectors.getConnectedRobotName as jest.MockedFunction<
  typeof RobotSelectors.getConnectedRobotName
>

describe('fetchPipetteOffsetCalibrationsOnConnectEpic', () => {
  let testScheduler: TestScheduler

  beforeEach(() => {
    mockGetRobotByName.mockReturnValue(mockRobot)

    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('dispatches nothing on robot:CONNECT_RESPONSE failure', () => {
    const action = {
      type: 'robot:CONNECT_RESPONSE',
      payload: { error: { message: 'AH' } },
    }

    mockGetConnectedRobotName.mockReturnValue(null)

    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const action$ = hot<Action>('--a', { a: action } as any)
      const state$ = hot<State>('a--', { a: mockState } as any)
      const output$ = pipetteOffsetCalibrationsEpic(action$, state$)

      expectObservable(output$).toBe('---')
    })
  })

  it('dispatches FETCH_PIPETTE_OFFSET_CALIBRATIONS on robot:CONNECT_RESPONSE success', () => {
    const action = {
      type: 'robot:CONNECT_RESPONSE',
      payload: {},
    }

    mockGetConnectedRobotName.mockReturnValue(mockRobot.name)

    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const action$ = hot<Action>('--a', { a: action } as any)
      const state$ = hot<State>('a--', { a: mockState } as any)
      const output$ = pipetteOffsetCalibrationsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchPipetteOffsetCalibrations(mockRobot.name),
      })
    })
  })
})
