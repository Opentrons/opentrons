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

const robotCalibrationCheckSessionData = {
  instruments: {},
  currentStep: 'sessionStart',
  nextSteps: {
    links: { specifyLabware: '/fake/route' },
  },
}

const SPECS: Array<EventSpec> = [
  {
    name: 'calibrationCheckStart',
    action: Calibration.fetchRobotCalibrationCheckSessionSuccess(
      'fake-robot-name',
      CalibrationFixtures.mockRobotCalibrationCheckSessionData,
      {}
    ),
    expected: {
      name: 'calibrationCheckStart',
      properties: robotCalibrationCheckSessionData,
    },
  },
  {
    name: 'calibrationCheckPass',
    action: Calibration.completeRobotCalibrationCheck('fake-robot-name'),
    expected: {
      name: 'calibrationCheckPass',
      properties: CalibrationFixtures.mockRobotCalibrationCheckSessionData,
    },
  },
]

const MOCK_STATE: State = ({ mockState: true }: any)

describe('robot calibration analytics events', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  SPECS.forEach(spec => {
    const { name, action, expected } = spec
    it(name, () => {
      Calibration.getRobotCalibrationCheckSession.mockReturnValue(
        CalibrationFixtures.mockRobotCalibrationCheckSessionData
      )
      return expect(makeEvent(action, MOCK_STATE)).resolves.toEqual(expected)
    })
  })
})
