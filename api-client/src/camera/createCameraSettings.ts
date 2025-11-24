import { POST, request } from '../request'

import type { CameraId } from '@opentrons/shared-data'
import type { CameraResponse, CameraSettings } from '../camera'
import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'

export function createCameraSettings(
  config: HostConfig,
  data: CameraSettings,
  cameraId: CameraId
): ResponsePromise<CameraResponse> {
  return request<CameraResponse, { data: CameraSettings }>(
    POST,
    `/camera/cameraSettings/${cameraId}`,
    { data },
    config
  )
}
