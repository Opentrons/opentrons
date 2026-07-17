import type { CameraImageSettings } from '@opentrons/api-client'
import type { CameraId } from '@opentrons/shared-data'
import type {
  updateCameraEnablement,
  updateCameraRecoveryEnablement,
  updateCameraSpecificSettings,
  updateCameraStreamEnablement,
  updateCameraUsageSettings,
  updateRunSetupStepsComplete,
  updateRunSetupStepsRequired,
} from '../actions'
import type {
  CAMERA_SETUP_STEP_KEY,
  LABWARE_SETUP_STEP_KEY,
  LPC_STEP_KEY,
  MODULE_SETUP_STEP_KEY,
  ROBOT_CALIBRATION_STEP_KEY,
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

export type CameraImageSettingsById = Record<CameraId, CameraImageSettings>

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
  cameraImageSettings: CameraImageSettingsById
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

export type RunSetupStepsAction =
  | ReturnType<typeof updateRunSetupStepsComplete>
  | ReturnType<typeof updateRunSetupStepsRequired>
  | ReturnType<typeof updateCameraEnablement>
  | ReturnType<typeof updateCameraRecoveryEnablement>
  | ReturnType<typeof updateCameraStreamEnablement>
  | ReturnType<typeof updateCameraUsageSettings>
  | ReturnType<typeof updateCameraSpecificSettings>
