import type {
  PipetteOffsetCalibration,
  TipLengthCalibration,
} from '../../../../redux/calibration/api-types'

export const mockPipetteOffsetCalibrationsResponse: PipetteOffsetCalibration = {
  id: 'pipetteName&left',
  pipette: 'serialNumber',
  mount: 'left',
  offset: [0, 0, 0],
  tiprack: 'mockTipRackHash',
  tiprackUri: 'mock/tiprack/uri',
  lastModified: '2023-01-26T20:31:41.991057+00:00',
  source: 'user',
  status: {
    markedBad: false,
    source: null,
    markedAt: null,
  },
}

export const mockTipLengthCalibrationResponse: TipLengthCalibration = {
  id: 'mockID',
  tipLength: 51.83,
  tiprack: 'mockTiprack',
  pipette: 'serialNumber',
  lastModified: '2023-01-27T20:43:14.373201+00:00',
  source: 'user',
  status: {
    markedBad: false,
    source: null,
    markedAt: null,
  },
  uri: 'mock/tiprack/uri',
}
