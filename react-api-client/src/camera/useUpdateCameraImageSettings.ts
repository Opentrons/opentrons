import { useMutation, useQueryClient } from 'react-query'

import { createCameraImageSettings } from '@opentrons/api-client'
import { OT_SYSTEM_CAMERA } from '@opentrons/shared-data'

import { useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  CameraImageSettings,
  CameraImageSettingsResponse,
  ErrorResponse,
} from '@opentrons/api-client'

export type UseUpdateCameraImageSettingsMutationResult = UseMutationResult<
  CameraImageSettingsResponse,
  AxiosError<ErrorResponse>,
  CameraImageSettings
> & {
  updateCameraImageSettings: UseMutateFunction<
    CameraImageSettingsResponse,
    AxiosError<ErrorResponse>,
    CameraImageSettings
  >
}

const cameraId = OT_SYSTEM_CAMERA

export function useUpdateCameraImageSettings(
  options: UseMutationOptions<
    CameraImageSettingsResponse,
    AxiosError<ErrorResponse>,
    CameraImageSettings
  > = {}
): UseUpdateCameraImageSettingsMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<
    CameraImageSettingsResponse,
    AxiosError<ErrorResponse>,
    CameraImageSettings
  >(
    [host, 'camera', 'cameraSettings', cameraId],
    (data: CameraImageSettings) =>
      createCameraImageSettings(host!, data, cameraId).then(response => {
        queryClient
          .invalidateQueries([host, 'camera', 'cameraSettings', cameraId])
          .catch(e => {
            throw e
          })
        return response.data
      }),
    options
  )

  return {
    ...mutation,
    updateCameraImageSettings: mutation.mutateAsync,
  }
}
