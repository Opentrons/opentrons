import { GET } from '../../robot-api'
import {
  makeResponseFixtures,
  mockFailureBody,
} from '../../robot-api/__fixtures__'
import { CALIBRATION_STATUS_PATH, DECK_CAL_STATUS_IDENTITY } from '../constants'

import type { ResponseFixtures } from '../../robot-api/__fixtures__'
import type {
  CalibrationStatus,
  ProtocolCalibrationStatus,
  DeckCalibrationInfo,
} from '../types'

export const mockCalibrationStatus: CalibrationStatus = {
  deckCalibration: {
    status: DECK_CAL_STATUS_IDENTITY,
    data: {
      type: 'affine',
      matrix: [
        [1.0, 0.0, 0.0, 0.0],
        [0.0, 1.0, 0.0, 0.0],
        [0.0, 0.0, 1.0, 0.0],
        [0.0, 0.0, 0.0, 1.0],
      ],
      lastModified: null,
      pipetteCalibratedWith: null,
      tiprack: null,
      source: 'user',
      status: {
        markedBad: false,
        source: 'unknown',
        markedAt: '',
      },
    },
  },
  instrumentCalibration: {
    right: {
      single: [0.0, 0.0, 0.0],
      multi: [0.0, 0.0, 0.0],
    },
    left: {
      single: [0.0, 0.0, 0.0],
      multi: [0.0, 0.0, 0.0],
    },
  },
}

export const {
  successMeta: mockFetchCalibrationStatusSuccessMeta,
  failureMeta: mockFetchCalibrationStatusFailureMeta,
  success: mockFetchCalibrationStatusSuccess,
  failure: mockFetchCalibrationStatusFailure,
}: ResponseFixtures<
  CalibrationStatus,
  { message: string }
> = makeResponseFixtures({
  method: GET,
  path: CALIBRATION_STATUS_PATH,
  successStatus: 200,
  successBody: mockCalibrationStatus,
  failureStatus: 500,
  failureBody: mockFailureBody,
})

export const mockProtocolCalibrationComplete: ProtocolCalibrationStatus = {
  complete: false,
  reason: 'calibrate_deck_failure_reason',
}

export const mockDeckCalData: DeckCalibrationInfo = {
  type: 'affine',
  matrix: [
    [1.0, 0.0, 0.0, 0.0],
    [0.0, 1.0, 0.0, 0.0],
    [0.0, 0.0, 1.0, 0.0],
    [0.0, 0.0, 0.0, 1.0],
  ],
  lastModified: 'September 15, 2021',
  pipetteCalibratedWith: null,
  tiprack: null,
  source: 'user',
  status: {
    markedBad: false,
    source: 'unknown',
    markedAt: '',
  },
}
