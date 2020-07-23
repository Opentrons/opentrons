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

export const mockLabwareCalibration1: LabwareCalibrationObjects = {
  attributes: {
    calibrationData: {
      offset: {
        value: [0.0, 0.0, 0.0],
        lastModified: '2020-04-05T14:30',
      },
      tipLength: {
        value: 30,
        lastModified: '2007-05-05T0:30',
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

export const mockLabwareCalibration2: LabwareCalibrationObjects = {
  attributes: {
    calibrationData: {
      offset: {
        value: [1.0, 1.0, 1.0],
        lastModified: '2020-04-05T14:30',
      },
      tipLength: {
        value: 30,
        lastModified: '2007-05-05T0:30',
      },
    },
    loadName: 'opentrons_96_tiprack_1000ul',
    namespace: 'opentrons',
    version: 1,
    parent: '',
  },
  id: 'some id',
  type: 'Labware Calibration',
}

export const mockAllLabwareCalibraton: AllLabwareCalibrations = {
  data: [mockLabwareCalibration1, mockLabwareCalibration2],
  meta: {},
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
