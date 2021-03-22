import { GET } from '../../../robot-api'
import {
  makeResponseFixtures,
  mockFailureBody,
} from '../../../robot-api/__fixtures__'
import { PIPETTE_OFFSET_CALIBRATIONS_PATH } from '../constants'

import type { ResponseFixtures } from '../../../robot-api/__fixtures__'
import type {
  PipetteOffsetCalibration,
  AllPipetteOffsetCalibrations,
} from '../../api-types'

export const mockPipetteOffsetCalibration1: PipetteOffsetCalibration = {
  pipette: 'P3HSV2008052020A02',
  mount: 'left',
  offset: [1.0, 2.0, 3.0],
  tiprackUri: 'opentrons/opentrons_96_tiprack_300ul/1',
  tiprack: 'asdasfasdasdhasjhdasdasda',
  lastModified: '2020-08-30T10:02',
  source: 'user',
  status: {
    markedBad: false,
    source: 'unknown',
    markedAt: '',
  },
  id: 'some id',
}

export const mockPipetteOffsetCalibration2: PipetteOffsetCalibration = {
  pipette: 'P20MV2008052020A02',
  mount: 'right',
  offset: [2.0, 4.0, 6.0],
  tiprackUri: 'opentrons/opentrons_96_tiprack_20ul/1',
  tiprack: 'aasdhakfghakjsdhlaksjhdak',
  lastModified: '2020-07-25T20:00',
  source: 'user',
  status: {
    markedBad: false,
    source: 'unknown',
    markedAt: '',
  },
  id: 'some id',
}

export const mockPipetteOffsetCalibration3: PipetteOffsetCalibration = {
  pipette: 'P1KVS2108052020A02',
  mount: 'right',
  offset: [4.0, 6.0, 8.0],
  tiprackUri: 'opentrons/opentrons_96_tiprack_1000ul/1',
  tiprack: 'asdakjsdhalksjdhlakjsdhalkhsd',
  lastModified: '2020-09-10T05:13',
  source: 'user',
  status: {
    markedBad: false,
    source: 'unknown',
    markedAt: '',
  },
  id: 'some id',
}

export const mockAllPipetteOffsetsCalibration: AllPipetteOffsetCalibrations = {
  data: [
    mockPipetteOffsetCalibration1,
    mockPipetteOffsetCalibration2,
    mockPipetteOffsetCalibration3,
  ],
}

export const {
  successMeta: mockFetchPipetteOffsetCalibrationsSuccessMeta,
  failureMeta: mockFetchPipetteOffsetCalibrationsFailureMeta,
  success: mockFetchPipetteOffsetCalibrationsSuccess,
  failure: mockFetchPipetteOffsetCalibrationsFailure,
}: ResponseFixtures<
  AllPipetteOffsetCalibrations,
  { message: string }
> = makeResponseFixtures({
  method: GET,
  path: PIPETTE_OFFSET_CALIBRATIONS_PATH,
  successStatus: 200,
  successBody: mockAllPipetteOffsetsCalibration,
  failureStatus: 500,
  failureBody: mockFailureBody,
})
