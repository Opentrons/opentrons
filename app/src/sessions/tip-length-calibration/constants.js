// @flow
// tip length calibration session constants
import { sharedCalCommands } from '../common-calibration/constants'

export const TIP_LENGTH_STEP_SESSION_STARTED: 'sessionStarted' =
  'sessionStarted'
export const TIP_LENGTH_STEP_LABWARE_LOADED: 'labwareLoaded' = 'labwareLoaded'
export const TIP_LENGTH_STEP_MEASURING_NOZZLE_OFFSET: 'measuringNozzleOffset' =
  'measuringNozzleOffset'
export const TIP_LENGTH_STEP_PREPARING_PIPETTE: 'preparingPipette' =
  'preparingPipette'
export const TIP_LENGTH_STEP_INSPECTING_TIP: 'inspectingTip' = 'inspectingTip'
export const TIP_LENGTH_STEP_MEASURING_TIP_OFFSET: 'measuringTipOffset' =
  'measuringTipOffset'
export const TIP_LENGTH_STEP_CALIBRATION_COMPLETE: 'calibrationComplete' =
  'calibrationComplete'

const MOVE_TO_REFERENCE_POINT: 'calibration.tipLength.moveToReferencePoint' =
  'calibration.tipLength.moveToReferencePoint'

export const tipCalCommands = {
  ...sharedCalCommands,
  MOVE_TO_REFERENCE_POINT,
}
