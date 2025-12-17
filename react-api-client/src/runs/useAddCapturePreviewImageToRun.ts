import { useMutation, useQueryClient } from 'react-query'

import { addCapturePreviewImageToRun } from '@opentrons/api-client'

import { useHost } from '../api'

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
  addCapturePreviewImageToRun: UseMutateFunction<
    DownloadedPreviewImageFileResponse,
    AxiosError<ErrorResponse>,
    AddCapturePreviewImageToRunParams
  >
}
export function useCapturePreviewImageToRun(): UseAddCapturePreviewImageToRunMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<
    DownloadedPreviewImageFileResponse,
    AxiosError<ErrorResponse>,
    AddCapturePreviewImageToRunParams
  >(({ runId, settings }) =>
    addCapturePreviewImageToRun(host!, runId, settings)
      .then(response => {
        queryClient
          .invalidateQueries([host, 'runs', runId])
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
    addCapturePreviewImageToRun: mutation.mutateAsync,
  }
}
