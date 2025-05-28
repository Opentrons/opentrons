// tip length calibration types
import type { LabwareDefinition, PipetteModel } from '@opentrons/shared-data'
import type {
  TIP_LENGTH_STEP_CALIBRATION_COMPLETE,
  TIP_LENGTH_STEP_INSPECTING_TIP,
  TIP_LENGTH_STEP_LABWARE_LOADED,
  TIP_LENGTH_STEP_MEASURING_NOZZLE_OFFSET,
  TIP_LENGTH_STEP_MEASURING_TIP_OFFSET,
  TIP_LENGTH_STEP_PREPARING_PIPETTE,
  TIP_LENGTH_STEP_SESSION_STARTED,
} from '../constants'
import type { CalibrationLabware, SessionCommandString } from '../types'

export type TipLengthCalibrationStep =
  | typeof TIP_LENGTH_STEP_SESSION_STARTED
  | typeof TIP_LENGTH_STEP_LABWARE_LOADED
  | typeof TIP_LENGTH_STEP_MEASURING_NOZZLE_OFFSET
  | typeof TIP_LENGTH_STEP_PREPARING_PIPETTE
  | typeof TIP_LENGTH_STEP_INSPECTING_TIP
  | typeof TIP_LENGTH_STEP_MEASURING_TIP_OFFSET
  | typeof TIP_LENGTH_STEP_CALIBRATION_COMPLETE

export interface TipLengthCalibrationInstrument {
  model: PipetteModel
  name: string
  tipLength: number
  mount: string
  serial: string
  defaultTipracks: LabwareDefinition[]
}

export interface TipLengthCalibrationSessionParams {
  mount: string
  hasCalibrationBlock: boolean
  tipRackDefinition: LabwareDefinition
}

export interface TipLengthCalibrationSessionDetails {
  instrument: TipLengthCalibrationInstrument
  currentStep: TipLengthCalibrationStep
  labware: CalibrationLabware[]
  supportedCommands: SessionCommandString[]
}
