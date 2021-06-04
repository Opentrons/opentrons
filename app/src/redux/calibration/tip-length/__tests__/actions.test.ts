import * as Fixtures from '../__fixtures__'
import * as Actions from '../actions'
import type { TipLengthCalibrationsAction } from '../types'

interface ActionSpec {
  should: string
  creator: (...args: any[]) => TipLengthCalibrationsAction
  args: unknown[]
  expected: TipLengthCalibrationsAction
}

const SPECS: ActionSpec[] = [
  {
    should: 'create a fetchTipLengthCalibrations action',
    creator: Actions.fetchTipLengthCalibrations,
    args: ['robot-name'],
    expected: {
      type: 'calibration:FETCH_TIP_LENGTH_CALIBRATIONS',
      payload: { robotName: 'robot-name' },
      meta: {} as any,
    },
  },
  {
    should: 'create a fetchTipLengthCalibrationsSuccess action',
    creator: Actions.fetchTipLengthCalibrationsSuccess,
    args: [
      'robot-name',
      Fixtures.mockFetchTipLengthCalibrationsSuccess.body,
      { requestId: '123' },
    ],
    expected: {
      type: 'calibration:FETCH_TIP_LENGTH_CALIBRATIONS_SUCCESS',
      payload: {
        robotName: 'robot-name',
        tipLengthCalibrations: Fixtures.mockAllTipLengthCalibrations,
      },
      meta: { requestId: '123' } as any,
    },
  },
  {
    should: 'create a fetchTipLengthCalibrationsFailure action',
    creator: Actions.fetchTipLengthCalibrationsFailure,
    args: [
      'robot-name',
      Fixtures.mockFetchTipLengthCalibrationsFailure.body,
      { requestId: '123' },
    ],
    expected: {
      type: 'calibration:FETCH_TIP_LENGTH_CALIBRATIONS_FAILURE',
      payload: {
        robotName: 'robot-name',
        error: Fixtures.mockFetchTipLengthCalibrationsFailure.body,
      },
      meta: { requestId: '123' } as any,
    },
  },
]

describe('tip length calibration actions', () => {
  SPECS.forEach(({ should, creator, args, expected }) => {
    it(should, () => {
      expect(creator(...args)).toEqual(expected)
    })
  })
})
