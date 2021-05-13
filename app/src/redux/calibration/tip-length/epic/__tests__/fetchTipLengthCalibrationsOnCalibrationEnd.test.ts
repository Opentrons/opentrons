// @flow

import { TestScheduler } from 'rxjs/testing'
import { selectors as RobotSelectors } from '../../../../robot'
import * as Actions from '../../actions'
import { tipLengthCalibrationsEpic } from '..'

import * as SessionFixtures from '../../../../sessions/__fixtures__'
import * as SessionTypes from '../../../../sessions/types'
import * as SessionActions from '../../../../sessions/actions'
import * as SessionSelectors from '../../../../sessions/selectors'

jest.mock('../../actions')
jest.mock('../../../../robot/selectors')
jest.mock('../../../../sessions/selectors')

const mockState = { state: true }
const mockRobotName = 'robot-name'

const mockGetConnectedRobotName: JestMockFn<[any], ?string> =
  RobotSelectors.getConnectedRobotName

const mockGetRobotSessionById: JestMockFn<[any, string, string], mixed> =
  SessionSelectors.getRobotSessionById

const SPECS: Array<{|
  describe: string,
  robotSession: SessionTypes.Session,
|}> = [
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
    describe: 'pipette offset calibration',
    robotSession: {
      ...SessionFixtures.mockTipLengthCalibrationSessionAttributes,
      id: SessionFixtures.mockSessionId,
    },
  },
]

describe('fetchTipLengthCalibrationsOnCalibrationEndEpic', () => {
  let testScheduler

  beforeEach(() => {
    mockGetConnectedRobotName.mockReturnValue(mockRobotName)

    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  SPECS.forEach(({ describe, robotSession }) => {
    it(`dispatches FETCH_TIP_LENGTH_CALIBRATIONS on ${describe} delete`, () => {
      mockGetConnectedRobotName.mockReturnValue(mockRobotName)
      mockGetRobotSessionById.mockReturnValue(robotSession)

      const action = SessionActions.deleteSession(
        mockRobotName,
        SessionFixtures.mockSessionId
      )

      testScheduler.run(({ hot, expectObservable, flush }) => {
        const action$ = hot('--a', { a: action })
        const state$ = hot('s-s', { s: mockState })
        const output$ = tipLengthCalibrationsEpic(action$, state$)

        expectObservable(output$).toBe('--a', {
          a: Actions.fetchTipLengthCalibrations(mockRobotName),
        })
      })
    })
  })

  it('dispatches nothing on other session (i.e. deck calibration) delete', () => {
    const mockDeckCalSession = {
      ...SessionFixtures.mockDeckCalibrationSessionAttributes,
      id: SessionFixtures.mockSessionId,
    }
    mockGetConnectedRobotName.mockReturnValue(mockRobotName)
    mockGetRobotSessionById.mockReturnValue(mockDeckCalSession)

    const action = SessionActions.deleteSession(
      mockRobotName,
      SessionFixtures.mockSessionId
    )

    testScheduler.run(({ hot, expectObservable, flush }) => {
      const action$ = hot('--a', { a: action })
      const state$ = hot('s-s', { s: mockState })
      const output$ = tipLengthCalibrationsEpic(action$, state$)

      expectObservable(output$).toBe('---')
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
        const action$ = hot('--a', { a: action })
        const state$ = hot('s-s', { s: mockState })
        const output$ = tipLengthCalibrationsEpic(action$, state$)

        expectObservable(output$).toBe('---')
      })
    })
  })
})
