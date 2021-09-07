import * as Fixtures from '../__fixtures__'
import * as Actions from '../actions'
import type { LabwareCalibrationAction } from '../types'

interface ActionSpec {
  should: string
  creator: (...args: any[]) => LabwareCalibrationAction
  args: unknown[]
  expected: LabwareCalibrationAction
}

const SPECS: ActionSpec[] = [
  {
    should: 'create a fetchLabwareCalibrations action',
    creator: Actions.fetchLabwareCalibrations,
    args: ['robot-name'],
    expected: {
      type: 'calibration:FETCH_LABWARE_CALIBRATIONS',
      payload: { robotName: 'robot-name' },
      meta: {} as any,
    },
  },
  {
    should: 'create a fetchLabwareCalibrationsSuccess action',
    creator: Actions.fetchLabwareCalibrationsSuccess,
    args: [
      'robot-name',
      Fixtures.mockFetchLabwareCalibrationSuccess.body,
      { requestId: '123' },
    ],
    expected: {
      type: 'calibration:FETCH_LABWARE_CALIBRATIONS_SUCCESS',
      payload: {
        robotName: 'robot-name',
        labwareCalibrations: Fixtures.mockAllLabwareCalibration,
      },
      meta: { requestId: '123' } as any,
    },
  },
  {
    should: 'create a fetchLabwareCalibrationsFailure action',
    creator: Actions.fetchLabwareCalibrationsFailure,
    args: [
      'robot-name',
      Fixtures.mockFetchLabwareCalibrationFailure.body,
      { requestId: '123' },
    ],
    expected: {
      type: 'calibration:FETCH_LABWARE_CALIBRATIONS_FAILURE',
      payload: {
        robotName: 'robot-name',
        error: Fixtures.mockFetchLabwareCalibrationFailure.body,
      },
      meta: { requestId: '123' } as any,
    },
  },
]

describe('calibration actions', () => {
  SPECS.forEach(({ should, creator, args, expected }) => {
    it(should, () => {
      expect(creator(...args)).toEqual(expected)
    })
  })
})
