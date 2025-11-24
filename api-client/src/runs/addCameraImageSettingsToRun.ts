import { POST, request } from '../request'

import type { CameraResponse, CameraSettings } from '../camera'
import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'

export function addCameraImageSettingsToRun(
  config: HostConfig,
  runId: string,
  data: CameraSettings
): ResponsePromise<CameraResponse> {
  return request<CameraResponse, { data: CameraSettings }>(
    POST,
    `/runs/${runId}/camera/cameraSettings`,
    { data },
    config
  )
}
