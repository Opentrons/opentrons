import { useMutation, useQueryClient } from 'react-query'

import { createCameraImageSettings } from '@opentrons/api-client'

import { useHost } from '../api'

import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  AxiosError,
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
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<
    CameraImageSettingsResponse,
    AxiosError<ErrorResponse>,
    CameraImageSettings
  >(
    [host, 'camera', 'cameraSettings'],
    async (data: CameraImageSettings) => {
      if (host == null) {
        throw new Error('Host config is required')
      }
      return await createCameraImageSettings(host, data).then(response => {
        queryClient
          .invalidateQueries([host, 'camera', 'cameraSettings'])
          .catch(e => {
            throw e
          })
        return response.data
      })
    },
    options as Omit<
      UseMutationOptions<
        CameraImageSettingsResponse,
        AxiosError<ErrorResponse>,
        CameraImageSettings
      >,
      'mutationFn' | 'mutationKey'
    >
  )

  return {
    ...mutation,
    createCameraImageSettings: mutation.mutate,
  }
}
