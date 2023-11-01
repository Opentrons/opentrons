// tip length calibration types
import {
  TIP_LENGTH_STEP_SESSION_STARTED,
  TIP_LENGTH_STEP_LABWARE_LOADED,
  TIP_LENGTH_STEP_MEASURING_NOZZLE_OFFSET,
  TIP_LENGTH_STEP_PREPARING_PIPETTE,
  TIP_LENGTH_STEP_INSPECTING_TIP,
  TIP_LENGTH_STEP_MEASURING_TIP_OFFSET,
  TIP_LENGTH_STEP_CALIBRATION_COMPLETE,
} from '../constants'
import type { CalibrationLabware, SessionCommandString } from '../types'

import type { LabwareDefinition2, PipetteModel } from '@opentrons/shared-data'

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
  defaultTipracks: LabwareDefinition2[]
}

export interface TipLengthCalibrationSessionParams {
  mount: string
  hasCalibrationBlock: boolean
  tipRackDefinition: LabwareDefinition2
}

export interface TipLengthCalibrationSessionDetails {
  instrument: TipLengthCalibrationInstrument
  currentStep: TipLengthCalibrationStep
  labware: CalibrationLabware[]
  supportedCommands: SessionCommandString[]
}
