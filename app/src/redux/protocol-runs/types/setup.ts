import type {
  CAMERA_SETUP_STEP_KEY,
  LABWARE_SETUP_STEP_KEY,
  LPC_STEP_KEY,
  MODULE_SETUP_STEP_KEY,
  ROBOT_CALIBRATION_STEP_KEY,
  UPDATE_RUN_SETUP_STEPS_COMPLETE,
  UPDATE_RUN_SETUP_STEPS_REQUIRED,
} from '../constants'

export type RobotCalibrationStepKey = typeof ROBOT_CALIBRATION_STEP_KEY
export type ModuleSetupStepKey = typeof MODULE_SETUP_STEP_KEY
export type LPCStepKey = typeof LPC_STEP_KEY
export type LabwareSetupStepKey = typeof LABWARE_SETUP_STEP_KEY
export type CameraSetupStepKey = typeof CAMERA_SETUP_STEP_KEY
export interface CameraState {
  required: boolean
  complete: boolean
  enabled: boolean
  liveStreamEnabled: boolean
  recoveryEnabled: boolean
}
export type StepKey =
  | RobotCalibrationStepKey
  | ModuleSetupStepKey
  | LPCStepKey
  | LabwareSetupStepKey
  | CameraSetupStepKey

export interface StepState {
  required: boolean
  complete: boolean
  cameraEnabled: boolean
  liveStreamEnabled: boolean
  cameraRecoveryEnabled: boolean
}

export type StepMap<V> = { [Step in StepKey]: V }

export type RunSetupStatus = {
  [Step in StepKey]: StepState
}

export interface UpdateRunSetupStepsCompleteAction {
  type: typeof UPDATE_RUN_SETUP_STEPS_COMPLETE
  payload: {
    runId: string
    complete: Partial<{ [Step in StepKey]: boolean }>
  }
}

export interface UpdateRunSetupStepsRequiredAction {
  type: typeof UPDATE_RUN_SETUP_STEPS_REQUIRED
  payload: {
    runId: string
    required: Partial<{ [Step in StepKey]: boolean }>
  }
}

export interface UpdateCameraEnablement {
  type: typeof CAMERA_SETUP_STEP_KEY
  payload: {
    runId: string
    required: CameraState
  }
}
export type RunSetupStepsAction =
  | UpdateRunSetupStepsCompleteAction
  | UpdateRunSetupStepsRequiredAction
  | UpdateCameraEnablement
