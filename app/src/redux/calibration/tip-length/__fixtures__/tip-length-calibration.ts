import { GET } from '../../../robot-api'
import {
  makeResponseFixtures,
  mockFailureBody,
} from '../../../robot-api/__fixtures__'
import { TIP_LENGTH_CALIBRATIONS_PATH } from '../constants'

import type { ResponseFixtures } from '../../../robot-api/__fixtures__'
import type {
  TipLengthCalibration,
  AllTipLengthCalibrations,
} from '../../api-types'

export const mockTipLengthCalibration1: TipLengthCalibration = {
  pipette: 'P3HSV2008052020A02',
  tiprack: 'asdasfasdasdhasjhdasdasda',
  tipLength: 30.5,
  lastModified: '2020-09-29T10:02',
  source: 'user',
  status: {
    markedBad: false,
    source: 'unknown',
    markedAt: '',
  },
  id: 'someID',
}

export const mockTipLengthCalibration2: TipLengthCalibration = {
  pipette: 'P20MV2008052020A02',
  tiprack: 'aasdhakfghakjsdhlaksjhdak',
  tipLength: 32.5,
  lastModified: '2020-09-29T12:02',
  source: 'user',
  status: {
    markedBad: false,
    source: 'unknown',
    markedAt: '',
  },
  id: 'someID',
}

export const mockTipLengthCalibration3: TipLengthCalibration = {
  pipette: 'P20MV2008052020A02',
  tiprack: 'opentrons_96_tiprack_20ul_hash',
  tipLength: 29.0,
  lastModified: '2020-09-29T13:02',
  source: 'user',
  status: {
    markedBad: false,
    source: 'unknown',
    markedAt: '',
  },
  id: 'someID',
}

export const mockPipetteMatchTipLengthCalibration: AllTipLengthCalibrations = {
  data: [
    {
      pipette: 'P3HSV2008052020A02',
      tiprack: 'opentrons_96_tiprack_20ul_hash',
      uri: 'custom/mock_tiprack_definition/1',
      tipLength: 29.0,
      lastModified: '2020-09-29T13:02',
      source: 'user',
      status: {
        markedBad: false,
        source: 'unknown',
        markedAt: '',
      },
      id: 'someID',
    },
  ],
}

export const mockAllTipLengthCalibrations: AllTipLengthCalibrations = {
  data: [
    mockTipLengthCalibration1,
    mockTipLengthCalibration2,
    mockTipLengthCalibration3,
  ],
}

export const {
  successMeta: mockFetchTipLengthCalibrationsSuccessMeta,
  failureMeta: mockFetchTipLengthCalibrationsFailureMeta,
  success: mockFetchTipLengthCalibrationsSuccess,
  failure: mockFetchTipLengthCalibrationsFailure,
}: ResponseFixtures<
  AllTipLengthCalibrations,
  { message: string }
> = makeResponseFixtures({
  method: GET,
  path: TIP_LENGTH_CALIBRATIONS_PATH,
  successStatus: 200,
  successBody: mockAllTipLengthCalibrations,
  failureStatus: 500,
  failureBody: mockFailureBody,
})
