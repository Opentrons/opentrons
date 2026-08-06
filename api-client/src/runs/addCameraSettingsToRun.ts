import { POST, request } from '../request'

import type { CameraData, CameraResponse } from '../camera'
import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'

export function addCameraSettingsToRun(
  config: HostConfig,
  runId: string,
  data: CameraData,
  userNotes: string
): ResponsePromise<CameraResponse> {
  return request<CameraResponse, { data: CameraData }>(
    POST,
    `/runs/${runId}/camera/settings`,
    config,
    { body: { data }, userNotes }
  )
}
