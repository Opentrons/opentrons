// @flow
import { GET } from '../../robot-api'
import {
  makeResponseFixtures,
  mockFailureBody,
} from '../../robot-api/__fixtures__'
import { CALIBRATION_STATUS_PATH, DECK_CAL_STATUS_IDENTITY } from '../constants'

import type { ResponseFixtures } from '../../robot-api/__fixtures__'
import type { CalibrationStatus } from '../types'

export const mockCalibrationStatus: CalibrationStatus = {
  deckCalibration: {
    status: DECK_CAL_STATUS_IDENTITY,
    data: [
      [1.0, 0.0, 0.0, 0.0],
      [0.0, 1.0, 0.0, 0.0],
      [0.0, 0.0, 1.0, 0.0],
      [0.0, 0.0, 0.0, 1.0],
    ],
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
  {| message: string |}
> = makeResponseFixtures({
  method: GET,
  path: CALIBRATION_STATUS_PATH,
  successStatus: 200,
  successBody: mockCalibrationStatus,
  failureStatus: 500,
  failureBody: mockFailureBody,
})
