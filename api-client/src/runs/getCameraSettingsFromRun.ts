import { GET, request } from '../request'

import type { CameraResponse, CameraSettings } from '../camera'
import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'

export function getCameraSettingsFromRun(
  config: HostConfig,
  runId: string,
  data: CameraSettings
): ResponsePromise<CameraResponse> {
  return request<CameraResponse, { data: CameraSettings }>(
    GET,
    `/runs/${runId}/camera/cameraSettings`,
    { data },
    config
  )
}
