import { useQueryClient } from 'react-query'

import { createCameraImageSettings } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { getQueryKey, useHost } from '../api'

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
import type { DocumentationState } from '../accessControl'

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

export type UseCreateCameraImageSettingsMutationOptions = UseMutationOptions<
  CameraImageSettingsResponse,
  AxiosError<ErrorResponse>,
  CameraImageSettings
>

export function useCreateCameraImageSettings(
  documentationState: DocumentationState,
  options: UseCreateCameraImageSettingsMutationOptions = {}
): UseCreateCameraImageSettingsMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useDocumentedMutation<
    CameraImageSettingsResponse,
    AxiosError<ErrorResponse>,
    CameraImageSettings
  >(
    documentationState,
    ['create_camera_image_settings'],
    ({ variables: data, userNotes }) =>
      createCameraImageSettings(host!, data, userNotes).then(response => {
        queryClient
          .invalidateQueries(getQueryKey(host, 'camera', 'cameraSettings'))
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
