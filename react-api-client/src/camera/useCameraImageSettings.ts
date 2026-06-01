import { useQuery } from 'react-query'

import { getCameraImageSettings } from '@opentrons/api-client'
import { OT_SYSTEM_CAMERA } from '@opentrons/shared-data'

import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { CameraImageSettingsResponse } from '@opentrons/api-client'

export function useCameraImageSettings(
  options: UseQueryOptions<CameraImageSettingsResponse> = {}
): UseQueryResult<CameraImageSettingsResponse> {
  const cameraId = OT_SYSTEM_CAMERA
  const host = useHost()
  const query = useQuery<CameraImageSettingsResponse>(
    getQueryKey(host, 'camera', 'cameraSettings', cameraId),
    () =>
      getCameraImageSettings(host!, cameraId)
        .then(response => response.data)
        .catch((e: AxiosError) => {
          throw e
        }),
    { ...options }
  )
  return query
}
