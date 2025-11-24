export interface CameraData {
  cameraEnabled: boolean
  liveStreamEnabled: boolean
  errorRecoveryCameraEnabled: boolean
}

export interface CameraSettings {
  cameraId: string
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

export type CameraResponse = CameraData
