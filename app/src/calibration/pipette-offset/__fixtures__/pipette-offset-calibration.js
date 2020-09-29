// @flow
import { GET } from '../../../robot-api'
import {
  makeResponseFixtures,
  mockFailureBody,
} from '../../../robot-api/__fixtures__'
import { PIPETTE_OFFSET_CALIBRATIONS_PATH } from '../constants'

import type { ResponseFixtures } from '../../../robot-api/__fixtures__'
import type {
  PipetteOffsetCalibrationModel,
  AllPipetteOffsetCalibrations,
} from '../../api-types'

export const mockPipetteOffsetCalibration1: PipetteOffsetCalibrationModel = {
  attributes: {
    pipette: 'P3HSV2008052020A02',
    mount: 'left',
    offset: [1.0, 2.0, 3.0],
    tiprack: 'opentrons_96_tiprack_300ul',
    lastModified: '2020-08-30T10:02',
  },
  id: 'some id',
  type: 'Pipette Offset Calibration',
}

export const mockPipetteOffsetCalibration2: PipetteOffsetCalibrationModel = {
  attributes: {
    pipette: 'P20MV2008052020A02',
    mount: 'right',
    offset: [2.0, 4.0, 6.0],
    tiprack: 'opentrons_96_tiprack_20ul',
    lastModified: '2020-07-25T20:00',
  },
  id: 'some id',
  type: 'Pipette Offset Calibration',
}

export const mockPipetteOffsetCalibration3: PipetteOffsetCalibrationModel = {
  attributes: {
    pipette: 'P1KVS2108052020A02',
    mount: 'right',
    offset: [4.0, 6.0, 8.0],
    tiprack: 'opentrons_96_tiprack_1000ul',
    lastModified: '2020-09-10T05:13',
  },
  id: 'some id',
  type: 'Pipette Offset Calibration',
}

export const mockAllPipetteOffsetsCalibration: AllPipetteOffsetCalibrations = {
  data: [
    mockPipetteOffsetCalibration1,
    mockPipetteOffsetCalibration2,
    mockPipetteOffsetCalibration3,
  ],
  meta: {},
}

export const {
  successMeta: mockFetchPipetteOffsetCalibrationsSuccessMeta,
  failureMeta: mockFetchPipetteOffsetCalibrationsFailureMeta,
  success: mockFetchPipetteOffsetCalibrationsSuccess,
  failure: mockFetchPipetteOffsetCalibrationsFailure,
}: ResponseFixtures<
  AllPipetteOffsetCalibrations,
  {| message: string |}
> = makeResponseFixtures({
  method: GET,
  path: PIPETTE_OFFSET_CALIBRATIONS_PATH,
  successStatus: 200,
  successBody: mockAllPipetteOffsetsCalibration,
  failureStatus: 500,
  failureBody: mockFailureBody,
})
