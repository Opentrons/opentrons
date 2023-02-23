import { Mount } from '../pipettes'

export interface PipOffsetDeletionParams {
  calType: 'pipetteOffset'
  pipette_id: string
  mount: Mount
}

export interface TipLengthDeletionParams {
  calType: 'tipLength'
  tiprack_hash: string
  pipette_id: string
}
export type DeleteCalRequestParams =
  | PipOffsetDeletionParams
  | TipLengthDeletionParams

export type FetchCalibrationStatusParams =
  | PipOffsetDeletionParams
  | TipLengthDeletionParams

type CalibrationSourceType =
  | 'default'
  | 'factory'
  | 'user'
  | 'calibration_check'
  | 'legacy'
  | 'unknown'
interface IndividualCalibrationHealthStatus {
  markedBad: boolean // will be marked bad by a faile cal health check
  source: CalibrationSourceType | null // what actor marked it bad
  markedAt: string | null // what timestamp it was marked bad
}

export interface DeckCalibrationData {
  type: 'attitude' | 'affine'
  matrix:
    | [
        [number, number, number],
        [number, number, number],
        [number, number, number]
      ]
    | [
        [number, number, number, number],
        [number, number, number, number],
        [number, number, number, number],
        [number, number, number, number]
      ]
  lastModified: string | null
  pipetteCalibratedWith: string | null // pipette serial number
  tiprack: string | null // tip rack hash
  source: CalibrationSourceType
  status: IndividualCalibrationHealthStatus
}
export interface DeckCalibrationStatus {
  status: 'OK' | 'IDENTITY' | 'BAD_CALIBRATION' | 'SINGULARITY'
  data: DeckCalibrationData
}
interface InstrumentOffset {
  single: [number, number, number]
  multi: [number, number, number]
}
export interface InstrumentCalibration {
  right: InstrumentOffset
  left: InstrumentOffset
}
export interface CalibrationStatus {
  deckCalibration: DeckCalibrationStatus
  instrumentCalibration: InstrumentCalibration
}

export interface PipetteOffsetCalibration {
  pipette: string
  mount: Mount
  offset: [number, number, number]
  tiprack: string
  tiprackUri: string
  lastModified: string
  source: CalibrationSourceType
  status: IndividualCalibrationHealthStatus
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
  source: CalibrationSourceType
  status: IndividualCalibrationHealthStatus
  id: string
  uri?: string | null
}

export interface AllTipLengthCalibrations {
  data: TipLengthCalibration[]
}
