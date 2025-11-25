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

export function useUpdateCamera(
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
    [host, 'camera', 'cameraSettings', OT_SYSTEM_CAMERA],
    (data: CameraImageSettings) =>
      createCameraImageSettings(host!, data, OT_SYSTEM_CAMERA).then(
        response => {
          queryClient
            .invalidateQueries([
              host,
              'camera',
              'cameraSettings',
              OT_SYSTEM_CAMERA,
            ])
            .catch(e => {
              throw e
            })
          return response.data
        }
      ),
    options
  )

  return {
    ...mutation,
    updateCameraImageSettings: mutation.mutate,
  }
}
