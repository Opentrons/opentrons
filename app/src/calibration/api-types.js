// @flow

import typeof {
  DECK_CAL_STATUS_OK,
  DECK_CAL_STATUS_IDENTITY,
  DECK_CAL_STATUS_BAD_CALIBRATION,
  DECK_CAL_STATUS_SINGULARITY,
} from './constants'

export type DeckCalibrationStatus =
  | DECK_CAL_STATUS_OK
  | DECK_CAL_STATUS_IDENTITY
  | DECK_CAL_STATUS_BAD_CALIBRATION
  | DECK_CAL_STATUS_SINGULARITY

export type AffineMatrix = [
  [number, number, number, number],
  [number, number, number, number],
  [number, number, number, number],
  [number, number, number, number]
]

export type AttitudeMatrix = [
  [number, number, number],
  [number, number, number],
  [number, number, number]
]

export type DeckCalibrationInfo = {|
  matrix: AffineMatrix | AttitudeMatrix,
  lastModified: string | null,
  pipetteCalibratedWith: string | null,
  tiprack: string | null,
  type: string,
|}

export type DeckCalibrationData = DeckCalibrationInfo | AffineMatrix

export type CalibrationStatus = {|
  deckCalibration: {|
    status: DeckCalibrationStatus,
    data: DeckCalibrationData,
  |},
  instrumentCalibration: {|
    right: {|
      single: [number, number, number],
      multi: [number, number, number],
    |},
    left: {|
      single: [number, number, number],
      multi: [number, number, number],
    |},
  |},
|}

export type OffsetData = {|
  value: [number, number, number],
  lastModified: string,
|}

export type TipLengthData = {|
  value: number,
  lastModified: string,
|}

export type CalibrationData = {|
  offset: OffsetData,
  tipLength: TipLengthData | null,
|}

export type LabwareCalibration = {|
  calibrationData: CalibrationData,
  loadName: string,
  namespace: string,
  version: number,
  parent: string,
  definitionHash: string,
|}

export type LabwareCalibrationModel = {|
  attributes: LabwareCalibration,
  type: string,
  id: string,
|}

export type AllLabwareCalibrations = {|
  data: Array<LabwareCalibrationModel>,
  meta: { ... },
|}
