import { GET, request } from '../request'

import type { CameraId } from '@opentrons/shared-data'
import type { CameraImageSettingsResponse } from '../camera'
import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'

export function getCameraImageSettings(
  config: HostConfig,
  cameraId: CameraId
): ResponsePromise<CameraImageSettingsResponse> {
  return request<CameraImageSettingsResponse>(
    GET,
    `/camera/cameraSettings/${cameraId}`,
    config
  )
}
