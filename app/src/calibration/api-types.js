// @flow

import typeof {
  DECK_CAL_STATUS_OK,
  DECK_CAL_STATUS_IDENTITY,
  DECK_CAL_STATUS_BAD_CALIBRATION,
  DECK_CAL_STATUS_SINGULARITY,
  CALIBRATION_SOURCE_DEFAULT,
  CALIBRATION_SOURCE_FACTORY,
  CALIBRATION_SOURCE_USER,
  CALIBRATION_SOURCE_CALIBRATION_CHECK,
  CALIBRATION_SOURCE_UNKNOWN,
  CALIBRATION_SOURCE_LEGACY,
} from './constants'

import type { Mount } from '@opentrons/components'

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

export type CalibrationSource =
  | CALIBRATION_SOURCE_DEFAULT
  | CALIBRATION_SOURCE_FACTORY
  | CALIBRATION_SOURCE_USER
  | CALIBRATION_SOURCE_CALIBRATION_CHECK
  | CALIBRATION_SOURCE_UNKNOWN
  | CALIBRATION_SOURCE_LEGACY

export type IndividualCalibrationStatus = {|
  markedBad: boolean,
  source: CalibrationSource | null,
  markedAt: string | null,
|}

export type DeckCalibrationInfo = {|
  matrix: AffineMatrix | AttitudeMatrix,
  lastModified: string | null,
  pipetteCalibratedWith: string | null,
  tiprack: string | null,
  type: string,
  source?: CalibrationSource,
  status?: IndividualCalibrationStatus,
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
  id: string,
|}

export type AllLabwareCalibrations = {|
  data: Array<LabwareCalibration>,
|}

export type PipetteOffsetCalibration = {|
  pipette: string,
  mount: Mount,
  offset: [number, number, number],
  tiprack: string,
  tiprackUri: string,
  lastModified: string,
  source: CalibrationSource,
  status: IndividualCalibrationStatus,
  id: string,
|}

export type AllPipetteOffsetCalibrations = {|
  data: Array<PipetteOffsetCalibration>,
|}

export type TipLengthCalibration = {|
  tipLength: number,
  tiprack: string,
  pipette: string,
  lastModified: string,
  source: CalibrationSource,
  status: IndividualCalibrationStatus,
  id: string,
|}

export type AllTipLengthCalibrations = {|
  data: Array<TipLengthCalibration>,
|}
