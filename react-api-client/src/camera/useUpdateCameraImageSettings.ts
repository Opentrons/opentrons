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

export type UseCreateCameraImageSettingsMutationResult = UseMutationResult<
  CameraImageSettingsResponse,
  AxiosError<ErrorResponse>,
  CameraImageSettings
> & {
  createCameraImageSettings: UseMutateFunction<
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
): UseCreateCameraImageSettingsMutationResult {
  const cameraId = OT_SYSTEM_CAMERA
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
    createCameraImageSettings: mutation.mutate,
  }
}
