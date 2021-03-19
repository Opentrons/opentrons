// @flow
// pipette offset calibration types
import typeof {
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
import type { LabwareDefinition2 } from '@opentrons/shared-data'

export type PipetteOffsetCalibrationStep =
  | PIP_OFFSET_STEP_SESSION_STARTED
  | PIP_OFFSET_STEP_LABWARE_LOADED
  | PIP_OFFSET_STEP_PREPARING_PIPETTE
  | PIP_OFFSET_STEP_INSPECTING_TIP
  | PIP_OFFSET_STEP_TIP_LENGTH_COMPLETE
  | PIP_OFFSET_STEP_JOGGING_TO_DECK
  | PIP_OFFSET_STEP_SAVING_POINT_ONE
  | PIP_OFFSET_STEP_CALIBRATION_COMPLETE
  | PIP_OFFSET_STEP_SESSION_EXITED

export type PipetteOffsetCalibrationInstrument = {|
  model: string,
  name: string,
  tipLength: number,
  mount: string,
  serial: string,
  defaultTipracks: Array<LabwareDefinition2>,
|}

export type PipetteOffsetCalibrationSessionParams = {|
  mount: string,
  shouldRecalibrateTipLength: boolean,
  hasCalibrationBlock: boolean,
  tipRackDefinition: LabwareDefinition2 | null,
|}

export type PipetteOffsetCalibrationSessionDetails = {|
  instrument: PipetteOffsetCalibrationInstrument,
  currentStep: PipetteOffsetCalibrationStep,
  labware: Array<CalibrationLabware>,
  shouldPerformTipLength: boolean,
  supportedCommands: Array<SessionCommandString>,
|}
