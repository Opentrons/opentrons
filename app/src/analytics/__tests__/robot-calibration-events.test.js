// @flow

import { makeEvent } from '../make-event'

import * as Calibration from '../../calibration'
import * as CalibrationFixtures from '../../calibration/__fixtures__'

import type { State, Action } from '../../types'
import type { AnalyticsEvent } from '../types'

jest.mock('../../calibration/selectors')

type EventSpec = {|
  name: string,
  action: Action,
  expected: AnalyticsEvent,
|}

const SPECS: Array<EventSpec> = [
  {
    name: 'calibrationCheckStart',
    action: Calibration.createSessionSuccess(
      'fake-robot-name',
      CalibrationFixtures.mockRobotCalibrationCheckSessionDetails,
      {}
    ),
    expected: {
      name: 'calibrationCheckStart',
      properties: CalibrationFixtures.mockRobotCalibrationCheckSessionDetails,
    },
  },
  {
    name: 'calibrationCheckPass',
    action: Calibration.completeRobotCalibrationCheck('fake-robot-name'),
    expected: {
      name: 'calibrationCheckPass',
      properties: CalibrationFixtures.mockRobotCalibrationCheckSessionDetails,
    },
  },
]

const getRobotCalibrationCheckSession: JestMockFn<
  [State, string],
  $Call<typeof Calibration.getRobotCalibrationCheckSession, State, string>
> = Calibration.getRobotCalibrationCheckSession

const MOCK_STATE: State = ({ mockState: true }: any)

describe('robot calibration analytics events', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    getRobotCalibrationCheckSession.mockReturnValue(
      CalibrationFixtures.mockRobotCalibrationCheckSessionDetails
    )
  })

  SPECS.forEach(spec => {
    const { name, action, expected } = spec
    it(name, () => {
      return expect(makeEvent(action, MOCK_STATE)).resolves.toEqual(expected)
    })
  })
})
