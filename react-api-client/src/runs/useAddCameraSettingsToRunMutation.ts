import { useQueryClient } from 'react-query'

import { addCameraSettingsToRun } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type { UseMutateFunction, UseMutationResult } from 'react-query'
import type {
  CameraData,
  CameraResponse,
  ErrorResponse,
} from '@opentrons/api-client'
import type { DocumentationState } from '../accessControl'

export interface AddCameraSettingsToRunParams {
  runId: string
  settings: CameraData
}

export type UseAddCameraSettingsToRunMutationResult = UseMutationResult<
  CameraResponse,
  AxiosError<ErrorResponse>,
  AddCameraSettingsToRunParams
> & {
  addCameraSettingsToRun: UseMutateFunction<
    CameraResponse,
    AxiosError<ErrorResponse>,
    AddCameraSettingsToRunParams
  >
}

export function useAddCameraSettingsToRunMutation(
  documentationState: DocumentationState
): UseAddCameraSettingsToRunMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useDocumentedMutation<
    CameraResponse,
    AxiosError<ErrorResponse>,
    AddCameraSettingsToRunParams
  >(
    documentationState,
    ['update_camera_settings_for_run'],
    ({ variables: { runId, settings }, userNotes }) =>
      addCameraSettingsToRun(host!, runId, settings, userNotes)
        .then(response => {
          queryClient
            .invalidateQueries(getQueryKey(host, 'runs', runId))
            .catch((e: Error) => {
              console.error(`error invalidating runs query: ${e.message}`)
            })
          return response.data
        })
        .catch((e: Error) => {
          console.error(`error adding camera settings: ${e.message}`)
          throw e
        })
  )

  return {
    ...mutation,
    addCameraSettingsToRun: mutation.mutate,
  }
}
