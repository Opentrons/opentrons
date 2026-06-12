import { POST, request } from '../request'

import type {
  CameraImageSettings,
  CameraImageSettingsResponse,
} from '../camera'
import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'

export function createCameraImageSettings(
  config: HostConfig,
  data: CameraImageSettings
): ResponsePromise<CameraImageSettingsResponse> {
  return request<CameraImageSettingsResponse, { data: CameraImageSettings }>(
    POST,
    `/camera/cameraSettings`,
    config,
    { body: { data } }
  )
}
