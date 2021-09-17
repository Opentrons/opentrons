// pipette offset calibration types
import {
  PIP_OFFSET_STEP_SESSION_STARTED,
  PIP_OFFSET_STEP_LABWARE_LOADED,
  PIP_OFFSET_STEP_PREPARING_PIPETTE,
  PIP_OFFSET_STEP_INSPECTING_TIP,
  PIP_OFFSET_STEP_JOGGING_TO_DECK,
  PIP_OFFSET_STEP_SAVING_POINT_ONE,
  PIP_OFFSET_STEP_CALIBRATION_COMPLETE,
  PIP_OFFSET_STEP_TIP_LENGTH_COMPLETE,
  PIP_OFFSET_STEP_SESSION_EXITED,
} from '../constants'
import type { CalibrationLabware, SessionCommandString } from '../types'
import type { LabwareDefinition2, PipetteModel } from '@opentrons/shared-data'

export type PipetteOffsetCalibrationStep =
  | typeof PIP_OFFSET_STEP_SESSION_STARTED
  | typeof PIP_OFFSET_STEP_LABWARE_LOADED
  | typeof PIP_OFFSET_STEP_PREPARING_PIPETTE
  | typeof PIP_OFFSET_STEP_INSPECTING_TIP
  | typeof PIP_OFFSET_STEP_TIP_LENGTH_COMPLETE
  | typeof PIP_OFFSET_STEP_JOGGING_TO_DECK
  | typeof PIP_OFFSET_STEP_SAVING_POINT_ONE
  | typeof PIP_OFFSET_STEP_CALIBRATION_COMPLETE
  | typeof PIP_OFFSET_STEP_SESSION_EXITED

export interface PipetteOffsetCalibrationInstrument {
  model: PipetteModel
  name: string
  tipLength: number
  mount: string
  serial: string
  defaultTipracks: LabwareDefinition2[]
}

export interface PipetteOffsetCalibrationSessionParams {
  mount: string
  // this will be false for pipette offset cal
  shouldRecalibrateTipLength: boolean
  hasCalibrationBlock: boolean
  tipRackDefinition: LabwareDefinition2 | null
}

export interface PipetteOffsetCalibrationSessionDetails {
  instrument: PipetteOffsetCalibrationInstrument
  currentStep: PipetteOffsetCalibrationStep
  labware: CalibrationLabware[]
  shouldPerformTipLength: boolean
  supportedCommands: SessionCommandString[]
}
