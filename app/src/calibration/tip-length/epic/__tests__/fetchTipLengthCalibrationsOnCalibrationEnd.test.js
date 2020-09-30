// @flow

import { TestScheduler } from 'rxjs/testing'
import { selectors as RobotSelectors } from '../../../../robot'
import * as Actions from '../../actions'
import { tipLengthCalibrationsEpic } from '..'

import * as SessionFixtures from '../../../../sessions/__fixtures__'
import * as SessionTypes from '../../../../sessions/types'
import * as SessionActions from '../../../../sessions/actions'

jest.mock('../../actions')
jest.mock('../../../../robot/selectors')

const mockState = { state: true }

const mockGetConnectedRobotName: JestMockFn<[any], ?string> =
  RobotSelectors.getConnectedRobotName

const SPECS: Array<{|
  describe: string,
  response: SessionTypes.SessionResponse,
|}> = [
  {
    describe: 'tip length calibration',
    response: SessionFixtures.mockDeleteTipLengthCalibrationSessionSuccess.body,
  },
  {
    describe: 'check calibration',
    response: SessionFixtures.mockDeleteSessionSuccess.body,
  },
  {
    describe: 'deck calibration',
    response: SessionFixtures.mockDeleteDeckCalibrationSessionSuccess.body,
  },
  {
    describe: 'pipette offset calibration',
    response:
      SessionFixtures.mockDeletePipetteOffsetCalibrationSessionSuccess.body,
  },
]

describe('fetchTipLengthCalibrationsOnCalibrationEndEpic', () => {
  let testScheduler

  beforeEach(() => {
    mockGetConnectedRobotName.mockReturnValue('robot-name')

    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('dispatches nothing on calibration session delete failure', () => {
    const action = SessionActions.deleteSessionFailure(
      'robot-api',
      'some-session-id',
      SessionFixtures.mockDeleteSessionFailure.body,
      {}
    )

    mockGetConnectedRobotName.mockReturnValue(null)

    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const action$ = hot('--a', { a: action })
      const state$ = hot('a--', { a: mockState })
      const output$ = tipLengthCalibrationsEpic(action$, state$)

      expectObservable(output$).toBe('---')
    })
  })

  SPECS.forEach(({ describe, response }) => {
    it(`dispatches FETCH_TIP_LENGTH_CALIBRATIONS on ${describe} delete success`, () => {
      mockGetConnectedRobotName.mockReturnValue('robot-name')

      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        const action$ = hot('--a', {
          a: SessionActions.deleteSessionSuccess('robot-name', response, {}),
        })
        const state$ = hot('a--', { a: mockState })
        const output$ = tipLengthCalibrationsEpic(action$, state$)

        expectObservable(output$).toBe('--a', {
          a: Actions.fetchTipLengthCalibrations('robot-name'),
        })
      })
    })
  })
})
