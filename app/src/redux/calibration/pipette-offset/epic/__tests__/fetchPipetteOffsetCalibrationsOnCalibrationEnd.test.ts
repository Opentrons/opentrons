import { TestScheduler } from 'rxjs/testing'
import { selectors as RobotSelectors } from '../../../../robot'
import * as Actions from '../../actions'
import { pipetteOffsetCalibrationsEpic } from '..'

import type { Action, State } from '../../../../types'

import * as SessionFixtures from '../../../../sessions/__fixtures__'
import * as SessionTypes from '../../../../sessions/types'
import * as SessionActions from '../../../../sessions/actions'
import * as SessionSelectors from '../../../../sessions/selectors'

jest.mock('../../actions')
jest.mock('../../../../robot/selectors')
jest.mock('../../../../sessions/selectors')

const mockState = { state: true }
const mockRobotName = 'robot-name'

const mockGetConnectedRobotName = RobotSelectors.getConnectedRobotName as jest.MockedFunction<
  typeof RobotSelectors.getConnectedRobotName
>

const mockGetRobotSessionById = SessionSelectors.getRobotSessionById as jest.MockedFunction<
  typeof SessionSelectors.getRobotSessionById
>

const SPECS: Array<{
  describe: string
  robotSession: SessionTypes.Session
}> = [
  {
    describe: 'tip length calibration',
    robotSession: {
      ...SessionFixtures.mockTipLengthCalibrationSessionAttributes,
      id: SessionFixtures.mockSessionId,
    },
  },
  {
    describe: 'check calibration',
    robotSession: {
      ...SessionFixtures.mockCalibrationCheckSessionAttributes,
      id: SessionFixtures.mockSessionId,
    },
  },
  {
    describe: 'deck calibration',
    robotSession: {
      ...SessionFixtures.mockDeckCalibrationSessionAttributes,
      id: SessionFixtures.mockSessionId,
    },
  },
  {
    describe: 'pipette offset calibration',
    robotSession: {
      ...SessionFixtures.mockTipLengthCalibrationSessionAttributes,
      id: SessionFixtures.mockSessionId,
    },
  },
]

describe('fetchPipetteOffsetCalibrationsOnCalibrationEndEpic', () => {
  let testScheduler: TestScheduler

  beforeEach(() => {
    mockGetConnectedRobotName.mockReturnValue('robot-name')

    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  SPECS.forEach(({ describe, robotSession }) => {
    it(`dispatches FETCH_PIPETTE_OFFSET_CALIBRATIONS on ${describe} delete`, () => {
      mockGetConnectedRobotName.mockReturnValue(mockRobotName)
      mockGetRobotSessionById.mockReturnValue(robotSession)

      const action = SessionActions.deleteSession(
        mockRobotName,
        SessionFixtures.mockSessionId
      )

      testScheduler.run(({ hot, expectObservable, flush }) => {
        const action$ = hot<Action>('--a', { a: action })
        const state$ = hot<State>('s-s', { s: mockState } as any)
        const output$ = pipetteOffsetCalibrationsEpic(action$, state$)

        expectObservable(output$).toBe('--a', {
          a: Actions.fetchPipetteOffsetCalibrations(mockRobotName),
        })
      })
    })
  })

  SPECS.forEach(({ describe, robotSession }) => {
    it(`dispatches nothing on ${describe} fetch`, () => {
      mockGetConnectedRobotName.mockReturnValue(mockRobotName)
      mockGetRobotSessionById.mockReturnValue(robotSession)

      const action = SessionActions.fetchSession(
        mockRobotName,
        SessionFixtures.mockSessionId
      )

      testScheduler.run(({ hot, expectObservable, flush }) => {
        const action$ = hot<Action>('--a', { a: action })
        const state$ = hot<State>('s-s', { s: mockState } as any)
        const output$ = pipetteOffsetCalibrationsEpic(action$, state$)

        expectObservable(output$).toBe('---')
      })
    })
  })
})
