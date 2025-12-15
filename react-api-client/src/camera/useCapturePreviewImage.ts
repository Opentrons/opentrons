import { useMutation, useQueryClient } from 'react-query'

import { createCapturePreviewImage } from '@opentrons/api-client'

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

export type UseCapturePreviewImageMutationResult = UseMutationResult<
  CameraImageSettingsResponse,
  AxiosError<ErrorResponse>,
  CameraImageSettings
> & {
  createCapturePreviewImage: UseMutateFunction<
    CameraImageSettingsResponse,
    AxiosError<ErrorResponse>,
    CameraImageSettings
  >
}

export function useCapturePreviewImage(
  options: UseMutationOptions<
    CameraImageSettingsResponse,
    AxiosError<ErrorResponse>,
    CameraImageSettings
  > = {}
): UseCapturePreviewImageMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<
    CameraImageSettingsResponse,
    AxiosError<ErrorResponse>,
    CameraImageSettings
  >(
    [host, 'camera', 'capturePreviewImage'],
    (data: CameraImageSettings) =>
      createCapturePreviewImage(host!, data).then(response => {
        queryClient
          .invalidateQueries([host, 'camera', 'capturePreviewImage'])
          .catch(e => {
            throw e
          })
        return response.data
      }),
    options
  )

  return {
    ...mutation,
    createCapturePreviewImage: mutation.mutate,
  }
}
