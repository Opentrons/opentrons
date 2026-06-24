import { useMutation, useQueryClient } from 'react-query'

import { addCapturePreviewImageToRun } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type { UseMutateFunction, UseMutationResult } from 'react-query'
import type {
  CameraImageSettings,
  DownloadedPreviewImageFileResponse,
  ErrorResponse,
} from '@opentrons/api-client'

export interface AddCapturePreviewImageToRunParams {
  runId: string
  settings: CameraImageSettings
}

export type UseAddCapturePreviewImageToRunMutationResult = UseMutationResult<
  DownloadedPreviewImageFileResponse,
  AxiosError<ErrorResponse>,
  AddCapturePreviewImageToRunParams
> & {
  createCapturePreviewImageToRun: UseMutateFunction<
    DownloadedPreviewImageFileResponse,
    AxiosError<ErrorResponse>,
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
    AxiosError<ErrorResponse>,
    AddCapturePreviewImageToRunParams
  >(({ settings }) =>
    addCapturePreviewImageToRun(host!, runId, settings)
      .then(response => {
        queryClient
          .invalidateQueries(
            getQueryKey(host, 'runs', runId, 'camera', 'capturePreviewImage')
          )
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
