import { useQueryClient } from 'react-query'

import { addCameraImageSettingsToRun } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type { UseMutateFunction, UseMutationResult } from 'react-query'
import type {
  CameraImageSettings,
  CameraImageSettingsResponse,
  ErrorResponse,
} from '@opentrons/api-client'
import type { DocumentationState } from '../accessControl'

export type UseAddCameraImageSettingsToRunMutationResult = UseMutationResult<
  CameraImageSettingsResponse,
  AxiosError<ErrorResponse>,
  CameraImageSettings
> & {
  addCameraImageSettingsToRun: UseMutateFunction<
    CameraImageSettingsResponse,
    AxiosError<ErrorResponse>,
    CameraImageSettings
  >
}

export function useAddCameraImageSettingsToRunMutation(
  documentationState: DocumentationState,
  runId: string
): UseAddCameraImageSettingsToRunMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()
  const mutation = useDocumentedMutation<
    CameraImageSettingsResponse,
    AxiosError<ErrorResponse>,
    CameraImageSettings
  >(
    documentationState,
    ['create_camera_image_settings'],
    ({ variables: settings, userNotes }) =>
      addCameraImageSettingsToRun(host!, runId, settings, userNotes)
        .then(response => {
          queryClient
            .invalidateQueries(getQueryKey(host, 'runs', runId))
            .catch((e: Error) => {
              console.error(`error invalidating runs query: ${e.message}`)
            })
          return response.data
        })
        .catch((e: Error) => {
          console.error(`error adding camera image settings: ${e.message}`)
          throw e
        })
  )

  return {
    ...mutation,
    addCameraImageSettingsToRun: mutation.mutate,
  }
}
