// @flow

import { makeEvent } from '../make-event'

import * as Calibration from '../../calibration'
import * as Sessions from '../../sessions'
import * as CalibrationFixtures from '../../calibration/__fixtures__'
import { mockRequestMeta } from '../../robot-api/__fixtures__'

import type { State, Action } from '../../types'
import type { AnalyticsEvent } from '../types'

jest.mock('../../sessions/selectors')

type EventSpec = {|
  name: string,
  action: Action,
  expected: AnalyticsEvent,
|}

const SPECS: Array<EventSpec> = [
  {
    name: 'calibrationCheckStart',
    action: Sessions.createSessionSuccess(
      'fake-robot-name',
      {
        data: {
          id: Calibration.CALIBRATION_CHECK_SESSION_ID,
          type: 'Session',
          attributes: {
            sessionType: Calibration.CALIBRATION_CHECK_SESSION_ID,
            details:
              CalibrationFixtures.mockRobotCalibrationCheckSessionDetails,
          },
        },
      },
      mockRequestMeta
    ),
    expected: {
      name: 'calibrationCheckStart',
      properties: {
        sessionType: Calibration.CALIBRATION_CHECK_SESSION_ID,
        details: CalibrationFixtures.mockRobotCalibrationCheckSessionDetails,
      },
    },
  },
  {
    name: 'calibrationCheckPass',
    action: Calibration.completeRobotCalibrationCheck('fake-robot-name'),
    expected: {
      name: 'calibrationCheckPass',
      properties: {
        sessionType: Calibration.CALIBRATION_CHECK_SESSION_ID,
        details: CalibrationFixtures.mockRobotCalibrationCheckSessionDetails,
      },
    },
  },
]

const getRobotSessionById: JestMockFn<
  [State, string, string],
  $Call<typeof Sessions.getRobotSessionById, State, string, string>
> = Sessions.getRobotSessionById

const MOCK_STATE: State = ({ mockState: true }: any)

describe('robot calibration analytics events', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    getRobotSessionById.mockReturnValue({
      sessionType: Calibration.CALIBRATION_CHECK_SESSION_ID,
      details: CalibrationFixtures.mockRobotCalibrationCheckSessionDetails,
    })
  })

  SPECS.forEach(spec => {
    const { name, action, expected } = spec
    it(name, () => {
      return expect(makeEvent(action, MOCK_STATE)).resolves.toEqual(expected)
    })
  })
})
