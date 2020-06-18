// @flow
// tip length calibration types
import typeof {
  TIP_LENGTH_STEP_SESSION_STARTED,
  TIP_LENGTH_STEP_LABWARE_LOADED,
  TIP_LENGTH_STEP_MEASURING_NOZZLE_OFFSET,
  TIP_LENGTH_STEP_PREPARING_PIPETTE,
  TIP_LENGTH_STEP_INSPECTING_TIP,
  TIP_LENGTH_STEP_MEASURING_TIP_OFFSET,
  TIP_LENGTH_STEP_CALIBRATION_COMPLETE,
} from '../constants'

import type {
  RobotCalibrationCheckInstrument,
  RobotCalibrationCheckLabware,
} from '../calibration-check/types'

export type TipLengthCalibrationStep =
  | TIP_LENGTH_STEP_SESSION_STARTED
  | TIP_LENGTH_STEP_LABWARE_LOADED
  | TIP_LENGTH_STEP_MEASURING_NOZZLE_OFFSET
  | TIP_LENGTH_STEP_PREPARING_PIPETTE
  | TIP_LENGTH_STEP_INSPECTING_TIP
  | TIP_LENGTH_STEP_MEASURING_TIP_OFFSET
  | TIP_LENGTH_STEP_CALIBRATION_COMPLETE

// TODO: update this type once the session details settle
export type TipLengthCalibrationSessionDetails = {|
  instruments: { [mount: string]: RobotCalibrationCheckInstrument, ... },
  currentStep: TipLengthCalibrationStep,
  labware: Array<RobotCalibrationCheckLabware>,
|}
