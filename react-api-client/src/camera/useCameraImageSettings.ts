import { useMutation, useQueryClient } from 'react-query'

import { getCameraImageSettings } from '@opentrons/api-client'

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
import type { CameraId } from '@opentrons/shared-data'

export type UseUpdateCameraMutationResult = UseMutationResult<
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

export function useCreateCameraSettings(
  options: UseMutationOptions<
    CameraImageSettingsResponse,
    AxiosError<ErrorResponse>,
    CameraImageSettings
  > = {},
  cameraId: CameraId
): UseUpdateCameraMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<
    CameraImageSettingsResponse,
    AxiosError<ErrorResponse>,
    CameraImageSettings
  >(
    [host, 'camera', 'cameraSettings', cameraId],
    (data: CameraImageSettings) =>
      getCameraImageSettings(host!, cameraId).then(response => {
        queryClient
          .invalidateQueries([host, 'camera', 'cameraSettings', cameraId])
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
