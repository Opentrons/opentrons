import { POST, request } from '../request'

import type {
  CameraId,
  CameraImageSettings,
  CameraImageSettingsResponse,
} from '../camera'
import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'

export function createCameraImageSettings(
  config: HostConfig,
  data: CameraImageSettings,
  cameraId: CameraId
): ResponsePromise<CameraImageSettingsResponse> {
  return request<CameraImageSettingsResponse, { data: CameraImageSettings }>(
    POST,
    `/camera/cameraSettings/${cameraId}`,
    { data },
    config
  )
}
