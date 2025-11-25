import { POST, request } from '../request'

import type { CameraId } from '@opentrons/shared-data'
import type { CameraImageSettings, CameraResponse } from '../camera'
import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'

export function createCameraImageSettings(
  config: HostConfig,
  data: CameraImageSettings,
  cameraId: CameraId
): ResponsePromise<CameraResponse> {
  return request<CameraResponse, { data: CameraImageSettings }>(
    POST,
    `/camera/cameraSettings/${cameraId}`,
    { data },
    config
  )
}
