// @flow
import { GET } from '../../../robot-api'
import {
  makeResponseFixtures,
  mockFailureBody,
} from '../../../robot-api/__fixtures__'
import { TIP_LENGTH_CALIBRATIONS_PATH } from '../constants'

import type { ResponseFixtures } from '../../../robot-api/__fixtures__'
import type {
  TipLengthCalibrationModel,
  AllTipLengthCalibrations,
} from '../../api-types'

export const mockTipLengthCalibration1: TipLengthCalibrationModel = {
  attributes: {
    pipetet: 'P3HSV2008052020A02',
    tiprack: 'opentrons_96_tiprack_300ul',
    tipLength: 30.5,
    lastModified: '2020-09-29T10:02',
  },
  id: 'someID',
  type: 'TipLengthCalibration',
}

export const mockTipLengthCalibration2: TipLengthCalibrationModel = {
  attributes: {
    pipetet: 'P3HMV2008052020A02',
    tiprack: 'opentrons_96_tiprack_300ul',
    tipLength: 32.5,
    lastModified: '2020-09-29T12:02',
  },
  id: 'someID',
  type: 'TipLengthCalibration',
}

export const mockTipLengthCalibration3: TipLengthCalibrationModel = {
  attributes: {
    pipetet: 'P20MV2008052020A02',
    tiprack: 'opentrons_96_tiprack_20ul',
    tipLength: 29.0,
    lastModified: '2020-09-29T13:02',
  },
  id: 'someID',
  type: 'TipLengthCalibration',
}

export const mockAllTipLengthCalibrations: AllTipLengthCalibrations = {
  data: [
    mockTipLengthCalibration1,
    mockTipLengthCalibration2,
    mockTipLengthCalibration3,
  ],
  meta: {},
}

export const {
  successMeta: mockFetchTipLengthCalibrationsSuccessMeta,
  failureMeta: mockFetchTipLengthCalibrationsFailureMeta,
  success: mockFetchTipLengthCalibrationsSuccess,
  failure: mockFetchTipLengthCalibrationsFailure,
}: ResponseFixtures<
  AllTipLengthCalibrations,
  {| message: string |}
> = makeResponseFixtures({
  method: GET,
  path: TIP_LENGTH_CALIBRATIONS_PATH,
  successStatus: 200,
  successBody: mockAllTipLengthCalibrations,
  failureStatus: 500,
  failureBody: mockFailureBody,
})
