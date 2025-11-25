import { useMutation, useQueryClient } from 'react-query'

import { createCameraImageSettings } from '@opentrons/api-client'

import { useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  CameraImageSettings,
  CameraResponse,
  ErrorResponse,
} from '@opentrons/api-client'
import type { CameraId } from '@opentrons/shared-data'

export type UseUpdateCameraImageSettingsMutationResult = UseMutationResult<
  CameraResponse,
  AxiosError<ErrorResponse>,
  CameraImageSettings
> & {
  updateCameraImageSettings: UseMutateFunction<
    CameraResponse,
    AxiosError<ErrorResponse>,
    CameraImageSettings
  >
}

export function useUpdateCamera(
  cameraId: CameraId,
  options: UseMutationOptions<
    CameraResponse,
    AxiosError<ErrorResponse>,
    CameraImageSettings
  > = {}
): UseUpdateCameraImageSettingsMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<
    CameraResponse,
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
    updateCameraImageSettings: mutation.mutate,
  }
}
