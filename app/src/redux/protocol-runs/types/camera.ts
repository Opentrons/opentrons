import type {
  CAMERA_ENABLEMENT,
  CAMERA_RECOVERY_ENABLEMENT,
  CAMERA_STREAM_ENABLEMENT,
} from '/app/redux/protocol-runs'

export interface CameraState {
  enabled: boolean
  liveStreamEnabled: boolean
  recoveryEnabled: boolean
}

export interface UpdateCameraEnablementAction {
  type: typeof CAMERA_ENABLEMENT
  payload: {
    runId: string
    enabled: boolean
  }
}

export interface UpdateCameraStreamEnablementAction {
  type: typeof CAMERA_STREAM_ENABLEMENT
  payload: {
    runId: string
    enabled: boolean
  }
}

export interface UpdateCameraRecoveryEnablementAction {
  type: typeof CAMERA_RECOVERY_ENABLEMENT
  payload: {
    runId: string
    enabled: boolean
  }
}

export type CameraAction =
  | UpdateCameraEnablementAction
  | UpdateCameraStreamEnablementAction
  | UpdateCameraRecoveryEnablementAction
