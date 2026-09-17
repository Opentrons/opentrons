import { useQueryClient } from 'react-query'

import { createCapturePreviewImage } from '@opentrons/api-client'

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

export function useCapturePreviewImage(
  documentationState: DocumentationState
): UseAddCapturePreviewImageMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()
  const mutation = useDocumentedMutation<
    DownloadedPreviewImageFileResponse,
    AxiosError<ErrorResponse>,
    AddCapturePreviewImageParams
  >(
    documentationState,
    ['capture_preview_image'],
    ({ variables: { settings }, userNotes }) =>
      createCapturePreviewImage(host!, settings, userNotes)
        .then(response => {
          queryClient
            .invalidateQueries(
              getQueryKey(host, 'camera', 'capturePreviewImage')
            )
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
