import { GET, request } from '../request'

import type { CameraId, CameraImageSettingsResponse } from '../camera'
import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'

export function getCameraImageSettings(
  config: HostConfig,
  cameraId: CameraId
): ResponsePromise<CameraImageSettingsResponse> {
  return request<CameraImageSettingsResponse>(
    GET,
    `/camera/cameraSettings/${cameraId}`,
    null,
    config
  )
}
