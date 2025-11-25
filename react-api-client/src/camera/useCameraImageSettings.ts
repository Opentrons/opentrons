import { useMutation, useQueryClient } from 'react-query'

import { getCameraImageSettings } from '@opentrons/api-client'
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

export type UseCameraImageSettingsMutationResult = UseMutationResult<
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

export function useCreateCameraImageSettings(
  options: UseMutationOptions<
    CameraImageSettingsResponse,
    AxiosError<ErrorResponse>,
    CameraImageSettings
  > = {}
): UseCameraImageSettingsMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<
    CameraImageSettingsResponse,
    AxiosError<ErrorResponse>,
    CameraImageSettings
  >(
    [host, 'camera', 'cameraSettings', OT_SYSTEM_CAMERA],
    (data: CameraImageSettings) =>
      getCameraImageSettings(host!, OT_SYSTEM_CAMERA).then(response => {
        queryClient
          .invalidateQueries([
            host,
            'camera',
            'cameraSettings',
            OT_SYSTEM_CAMERA,
          ])
          .catch((e: Error) => {
            throw e
          })
        return response.data
      }),
    options
  )
  return {
    ...mutation,
    updateCameraImageSettings: mutation.mutate,
  }
}
