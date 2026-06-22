import { POST, request } from '../request'

import type {
  CameraImageSettings,
  CameraImageSettingsResponse,
} from '../camera'
import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'

export function addCameraImageSettingsToRun(
  config: HostConfig,
  runId: string,
  data: CameraImageSettings
): ResponsePromise<CameraImageSettingsResponse> {
  return request<CameraImageSettingsResponse, { data: CameraImageSettings }>(
    POST,
    `/runs/${runId}/camera/cameraSettings`,
    config,
    { body: { data } }
  )
}
