// @flow

import { TestScheduler } from 'rxjs/testing'
import { selectors as RobotSelectors } from '../../../../robot'
import * as DiscoverySelectors from '../../../../discovery/selectors'
import * as Actions from '../../actions'
import { pipetteOffsetCalibrationsEpic } from '..'

jest.mock('../../actions')
jest.mock('../../../../robot/selectors')
jest.mock('../../../../discovery/selectors')

const mockState = { state: true }
const mockRobot = { name: 'robot', ip: '127.0.0.1', port: 31950 }

const mockGetRobotByName: JestMockFn<[any, string], mixed> =
  DiscoverySelectors.getRobotByName

const mockGetConnectedRobotName: JestMockFn<[any], ?string> =
  RobotSelectors.getConnectedRobotName

describe('fetchPipetteOffsetCalibrationsOnConnectEpic', () => {
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

  it('dispatches nothing on robot:CONNECT_RESPONSE failure', () => {
    const action = {
      type: 'robot:CONNECT_RESPONSE',
      payload: { error: { message: 'AH' } },
    }

    mockGetConnectedRobotName.mockReturnValue(null)

    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const action$ = hot('--a', { a: action })
      const state$ = hot('a--', { a: mockState })
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
      const action$ = hot('--a', { a: action })
      const state$ = hot('a--', { a: mockState })
      const output$ = pipetteOffsetCalibrationsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchPipetteOffsetCalibrations(mockRobot.name),
      })
    })
  })
})
