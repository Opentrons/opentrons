import * as Fixtures from '../__fixtures__'
import * as Actions from '../actions'
import type { PipetteOffsetCalibrationsAction } from '../types'

interface ActionSpec {
  should: string
  creator: (...args: any[]) => PipetteOffsetCalibrationsAction
  args: unknown[]
  expected: PipetteOffsetCalibrationsAction
}

const SPECS: ActionSpec[] = [
  {
    should: 'create a fetchPipetteOffsetCalibrations action',
    creator: Actions.fetchPipetteOffsetCalibrations,
    args: ['robot-name'],
    expected: {
      type: 'calibration:FETCH_PIPETTE_OFFSET_CALIBRATIONS',
      payload: { robotName: 'robot-name' },
      meta: {} as any,
    },
  },
  {
    should: 'create a fetchPipetteOffsetCalibrationsSuccess action',
    creator: Actions.fetchPipetteOffsetCalibrationsSuccess,
    args: [
      'robot-name',
      Fixtures.mockFetchPipetteOffsetCalibrationsSuccess.body,
      { requestId: '123' },
    ],
    expected: {
      type: 'calibration:FETCH_PIPETTE_OFFSET_CALIBRATIONS_SUCCESS',
      payload: {
        robotName: 'robot-name',
        pipetteOffsetCalibrations: Fixtures.mockAllPipetteOffsetsCalibration,
      },
      meta: { requestId: '123' } as any,
    },
  },
  {
    should: 'create a fetchPipetteOffsetCalibrationsFailure action',
    creator: Actions.fetchPipetteOffsetCalibrationsFailure,
    args: [
      'robot-name',
      Fixtures.mockFetchPipetteOffsetCalibrationsFailure.body,
      { requestId: '123' },
    ],
    expected: {
      type: 'calibration:FETCH_PIPETTE_OFFSET_CALIBRATIONS_FAILURE',
      payload: {
        robotName: 'robot-name',
        error: Fixtures.mockFetchPipetteOffsetCalibrationsFailure.body,
      },
      meta: { requestId: '123' } as any,
    },
  },
]

describe('pipette offset calibration actions', () => {
  SPECS.forEach(({ should, creator, args, expected }) => {
    it(should, () => {
      expect(creator(...args)).toEqual(expected)
    })
  })
})
