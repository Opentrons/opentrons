import { useQueryClient } from 'react-query'

import { addCapturePreviewImageToRun } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type { UseMutateFunction, UseMutationResult } from 'react-query'
import type {
  CameraImageSettings,
  DownloadedPreviewImageFileResponse,
  ErrorResponse,
} from '@opentrons/api-client'
import type { DocumentationState } from '../accessControl'

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
  documentationState: DocumentationState,
  runId: string
): UseAddCapturePreviewImageToRunMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useDocumentedMutation<
    DownloadedPreviewImageFileResponse,
    AxiosError<ErrorResponse>,
    AddCapturePreviewImageToRunParams
  >(
    documentationState,
    ['capture_preview_image'],
    ({ variables: { settings }, userNotes }) =>
      addCapturePreviewImageToRun(host!, runId, settings, userNotes)
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
