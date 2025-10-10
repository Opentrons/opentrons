export interface CameraData {
  data: {
    cameraEnabled: boolean
    liveStreamEnabled: boolean
    errorRecoveryCameraEnabled: boolean
  }
}

export interface CameraMeta {
  cursor: number
  totalLength: number
}

export type CreateCameraData = CameraData
