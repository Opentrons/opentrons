import { useMutation, useQueryClient } from 'react-query'

import { addCapturePreviewImageToRun } from '@opentrons/api-client'

import { useHost } from '../api'

import type { UseMutateFunction, UseMutationResult } from 'react-query'
import type {
  CameraImageSettings,
  DownloadedPreviewImageFileResponse,
  ErrorResponse,
  HttpClientError,
} from '@opentrons/api-client'

export interface AddCapturePreviewImageToRunParams {
  runId: string
  settings: CameraImageSettings
}

export type UseAddCapturePreviewImageToRunMutationResult = UseMutationResult<
  DownloadedPreviewImageFileResponse,
  HttpClientError<ErrorResponse>,
  AddCapturePreviewImageToRunParams
> & {
  createCapturePreviewImageToRun: UseMutateFunction<
    DownloadedPreviewImageFileResponse,
    HttpClientError<ErrorResponse>,
    AddCapturePreviewImageToRunParams
  >
}
export function useCapturePreviewImageToRun(
  runId: string
): UseAddCapturePreviewImageToRunMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<
    DownloadedPreviewImageFileResponse,
    HttpClientError<ErrorResponse>,
    AddCapturePreviewImageToRunParams
  >(({ settings }) =>
    addCapturePreviewImageToRun(host!, runId, settings, {
      responseType: 'blob',
    })
      .then(response => {
        queryClient
          .invalidateQueries([
            host,
            'runs',
            runId,
            'camera',
            'capturePreviewImage',
          ])
          .catch((e: Error) => {
            console.error(`error invalidating runs query: ${e.message}`)
          })
        return response.data
      })
      .catch((e: Error) => {
        console.error(`error capturing preview image on run: ${e.message}`)
        throw e
      })
  )
  return {
    ...mutation,
    createCapturePreviewImageToRun: mutation.mutateAsync,
  }
}
