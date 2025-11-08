export interface CameraData {
  cameraEnabled: boolean
  liveStreamEnabled: boolean
  errorRecoveryCameraEnabled: boolean
}

export interface CreateCameraData {
  data: CameraData
}

export type CameraResponse = CameraData
