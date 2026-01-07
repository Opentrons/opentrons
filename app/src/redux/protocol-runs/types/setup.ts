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

export interface BaseStepState {
  required: boolean
  complete: boolean
}

export interface CameraStepState extends BaseStepState {
  cameraEnabled: boolean
  liveStreamEnabled: boolean
  recoveryEnabled: boolean
}

export interface RunSetupStatusPartial {
  [ROBOT_CALIBRATION_STEP_KEY]?: Partial<BaseStepState>
  [MODULE_SETUP_STEP_KEY]?: Partial<BaseStepState>
  [LPC_STEP_KEY]?: Partial<BaseStepState>
  [LABWARE_SETUP_STEP_KEY]?: Partial<BaseStepState>
  [CAMERA_SETUP_STEP_KEY]?: Partial<CameraStepState>
}

export interface RunSetupStatus {
  [ROBOT_CALIBRATION_STEP_KEY]: BaseStepState
  [MODULE_SETUP_STEP_KEY]: BaseStepState
  [LPC_STEP_KEY]: BaseStepState
  [LABWARE_SETUP_STEP_KEY]: BaseStepState
  [CAMERA_SETUP_STEP_KEY]: CameraStepState
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
    cameraEnabled: boolean
  }
}

export interface UpdateCameraErrorRecoveryEnablement {
  type: typeof CAMERA_SETUP_STEP_KEY
  payload: {
    runId: string
    recoveryEnabled: boolean
  }
}
export interface UpdateLivestreamEnabled {
  type: typeof CAMERA_SETUP_STEP_KEY
  payload: {
    runId: string
    liveStreamEnabled: boolean
  }
}

export interface UpdateAllCameraSettings {
  type: typeof CAMERA_SETUP_STEP_KEY
  payload: {
    runId: string
    liveStreamEnabled: boolean
    recoveryEnabled: boolean
    cameraEnabled: boolean
  }
}

export type RunSetupStepsAction =
  | UpdateRunSetupStepsCompleteAction
  | UpdateRunSetupStepsRequiredAction
  | UpdateCameraEnablement
  | UpdateAllCameraSettings
  | UpdateLivestreamEnabled
  | UpdateCameraErrorRecoveryEnablement
