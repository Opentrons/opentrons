import { useMutation, useQueryClient } from 'react-query'

import { createCapturePreviewImage } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type { UseMutateFunction, UseMutationResult } from 'react-query'
import type {
  CameraImageSettings,
  DownloadedPreviewImageFileResponse,
  ErrorResponse,
} from '@opentrons/api-client'

export interface AddCapturePreviewImageParams {
  settings: CameraImageSettings
}

export type UseAddCapturePreviewImageMutationResult = UseMutationResult<
  DownloadedPreviewImageFileResponse,
  AxiosError<ErrorResponse>,
  AddCapturePreviewImageParams
> & {
  createCapturePreviewImage: UseMutateFunction<
    DownloadedPreviewImageFileResponse,
    AxiosError<ErrorResponse>,
    AddCapturePreviewImageParams
  >
}

export function useCapturePreviewImage(): UseAddCapturePreviewImageMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()
  const mutation = useMutation<
    DownloadedPreviewImageFileResponse,
    AxiosError<ErrorResponse>,
    AddCapturePreviewImageParams
  >(({ settings }) =>
    createCapturePreviewImage(host!, settings)
      .then(response => {
        queryClient
          .invalidateQueries(getQueryKey(host, 'camera', 'capturePreviewImage'))
          .catch((e: Error) => {
            console.error(`error invalidating camera query: ${e.message}`)
          })
        return response.data
      })
      .catch((e: Error) => {
        console.error(
          `error capturing preview image in camera settings: ${e.message}`
        )
        throw e
      })
  )
  return {
    ...mutation,
    createCapturePreviewImage: mutation.mutateAsync,
  }
}
