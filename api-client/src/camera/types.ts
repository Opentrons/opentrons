export interface CameraData {
  data: {
    liveVideo: boolean,
    errorRecovery: boolean
  }
  firmwareVersion?: string
  instrumentName: string
  instrumentType: 'camera'
  serialNumber: string
  state?: {
    enabled: boolean
  }
  ok: true
}

export interface CameraMeta {
  cursor: number
  totalLength: number
}

export type CreateCameraData = CameraData