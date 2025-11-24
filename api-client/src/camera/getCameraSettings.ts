import { GET, request } from '../request'

import type { CameraId } from '@opentrons/shared-data'
import type { CameraResponse, CameraSettings } from '../camera'
import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'

export function getCameraSettings(
  config: HostConfig,
  data: CameraSettings,
  cameraId: CameraId
): ResponsePromise<CameraResponse> {
  return request<CameraResponse, { data: CameraSettings }>(
    GET,
    `/camera/cameraSettings/${cameraId}`,
    { data },
    config
  )
}
