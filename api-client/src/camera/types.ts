export interface CameraData {
  cameraEnabled: boolean
  liveStreamEnabled: boolean
  errorRecoveryCameraEnabled: boolean
}

export interface CameraImageSettings {
  cameraId: CameraId
  resolution?: [number, number]
  zoom?: number
  contrast?: number
  brightness?: number
  saturation?: number
  pan?: [number, number]
}

export interface CreateCameraData {
  data: CameraData
}

export type CameraId = string
export type CameraResponse = CameraData
export type CameraImageSettingsResponse = CameraImageSettings
