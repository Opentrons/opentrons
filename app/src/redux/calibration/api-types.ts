import {
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

import type { PipetteMount } from '@opentrons/shared-data'

export type DeckCalibrationStatus =
  | typeof DECK_CAL_STATUS_OK
  | typeof DECK_CAL_STATUS_IDENTITY
  | typeof DECK_CAL_STATUS_BAD_CALIBRATION
  | typeof DECK_CAL_STATUS_SINGULARITY

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
  | typeof CALIBRATION_SOURCE_DEFAULT
  | typeof CALIBRATION_SOURCE_FACTORY
  | typeof CALIBRATION_SOURCE_USER
  | typeof CALIBRATION_SOURCE_CALIBRATION_CHECK
  | typeof CALIBRATION_SOURCE_UNKNOWN
  | typeof CALIBRATION_SOURCE_LEGACY

export interface IndividualCalibrationStatus {
  markedBad: boolean
  source: CalibrationSource | null
  markedAt: string | null
}

export interface DeckCalibrationInfo {
  matrix: AffineMatrix | AttitudeMatrix
  lastModified: string | null
  pipetteCalibratedWith: string | null
  tiprack: string | null
  type: string
  source?: CalibrationSource
  status?: IndividualCalibrationStatus
}

export type DeckCalibrationData = DeckCalibrationInfo | AffineMatrix

export interface CalibrationStatus {
  deckCalibration: {
    status: DeckCalibrationStatus
    data: DeckCalibrationData
  }
  instrumentCalibration: {
    right: {
      single: [number, number, number]
      multi: [number, number, number]
    }
    left: {
      single: [number, number, number]
      multi: [number, number, number]
    }
  }
}

export interface OffsetData {
  value: [number, number, number]
  lastModified: string
}

export interface TipLengthData {
  value: number
  lastModified: string
}

export interface CalibrationData {
  offset: OffsetData
  tipLength: TipLengthData | null
}

export interface LabwareCalibration {
  calibrationData: CalibrationData
  loadName: string
  namespace: string
  version: number
  parent: string
  definitionHash: string
  id: string
}

export interface AllLabwareCalibrations {
  data: LabwareCalibration[]
}

export interface PipetteOffsetCalibration {
  pipette: string
  mount: PipetteMount
  offset: [number, number, number]
  tiprack: string
  tiprackUri: string
  lastModified: string
  source: CalibrationSource
  status: IndividualCalibrationStatus
  id: string
}

export interface AllPipetteOffsetCalibrations {
  data: PipetteOffsetCalibration[]
}

export interface TipLengthCalibration {
  tipLength: number
  tiprack: string
  pipette: string
  lastModified: string
  source: CalibrationSource
  status: IndividualCalibrationStatus
  id: string
  uri?: string | null
}

export interface AllTipLengthCalibrations {
  data: TipLengthCalibration[]
}
