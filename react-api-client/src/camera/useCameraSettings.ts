import { useMutation, useQueryClient } from 'react-query'

import { createCameraSettings } from '@opentrons/api-client'

import { useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  CameraResponse,
  CameraSettings,
  ErrorResponse,
} from '@opentrons/api-client'
import type { CameraId } from '@opentrons/shared-data'

export type UseUpdateCameraMutationResult = UseMutationResult<
  CameraResponse,
  AxiosError<ErrorResponse>,
  CameraSettings
> & {
  updateCameraSettings: UseMutateFunction<
    CameraResponse,
    AxiosError<ErrorResponse>,
    CameraSettings
  >
}

export function useCameraSettings(
  options: UseMutationOptions<
    CameraResponse,
    AxiosError<ErrorResponse>,
    CameraSettings
  > = {},
  cameraId: CameraId
): UseUpdateCameraMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<
    CameraResponse,
    AxiosError<ErrorResponse>,
    CameraSettings
  >(
    [host, 'camera/settings'],
    (data: CameraSettings) =>
      createCameraSettings(host!, data, cameraId).then(response => {
        queryClient.invalidateQueries([host, 'camera']).catch((e: Error) => {
          throw e
        })
        return response.data
      }),
    options
  )

  return {
    ...mutation,
    updateCameraSettings: mutation.mutate,
  }
}
