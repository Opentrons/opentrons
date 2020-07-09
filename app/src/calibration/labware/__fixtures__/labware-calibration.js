// @flow
import { GET } from '../../../robot-api'
import {
  makeResponseFixtures,
  mockFailureBody,
} from '../../../robot-api/__fixtures__'
import { LABWARE_CALIBRATION_PATH } from '../constants'

import type { ResponseFixtures } from '../../../robot-api/__fixtures__'
import type {
  LabwareCalibrationObjects,
  AllLabwareCalibrations,
} from '../../api-types'

export const mockLabwareCalibration: LabwareCalibrationObjects = {
  attributes: {
    calibrationData: {
      offset: {
        value: [0.0, 0.0, 0.0],
        lastModified: '2020-03-27 19:43:24.642318',
      },
      tipLength: {
        value: 30,
        lastModified: '2020-03-27 19:43:24.642318',
      },
    },
    loadName: 'opentrons_96_tiprack_10ul',
    namespace: 'opentrons',
    version: 1,
    parent: 'fake_id',
  },
  id: 'some id',
  type: 'Labware Calibration',
}

export const mockAllLabwareCalibraton: AllLabwareCalibrations = {
  data: [mockLabwareCalibration],
  meta: {},
  type: 'Labware Calibration',
}

export const {
  successMeta: mockFetchLabwareCalibrationSuccessMeta,
  failureMeta: mockFetchLabwareCalibrationFailureMeta,
  success: mockFetchLabwareCalibrationSuccess,
  failure: mockFetchLabwareCalibrationFailure,
}: ResponseFixtures<
  AllLabwareCalibrations,
  {| message: string |}
> = makeResponseFixtures({
  method: GET,
  path: LABWARE_CALIBRATION_PATH,
  successStatus: 200,
  successBody: mockAllLabwareCalibraton,
  failureStatus: 500,
  failureBody: mockFailureBody,
})
