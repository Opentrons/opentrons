import { useMutation, useQueryClient } from 'react-query'

import { addCameraSettingsToRun } from '@opentrons/api-client'

import { useHost } from '../api'

import type { UseMutateFunction, UseMutationResult } from 'react-query'
import type {
  CameraData,
  CameraResponse,
  ErrorResponse,
  HttpClientError,
} from '@opentrons/api-client'

export interface AddCameraSettingsToRunParams {
  runId: string
  settings: CameraData
}

export type UseAddCameraSettingsToRunMutationResult = UseMutationResult<
  CameraResponse,
  HttpClientError<ErrorResponse>,
  AddCameraSettingsToRunParams
> & {
  addCameraSettingsToRun: UseMutateFunction<
    CameraResponse,
    HttpClientError<ErrorResponse>,
    AddCameraSettingsToRunParams
  >
}

export function useAddCameraSettingsToRunMutation(): UseAddCameraSettingsToRunMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<
    CameraResponse,
    HttpClientError<ErrorResponse>,
    AddCameraSettingsToRunParams
  >(({ runId, settings }) =>
    addCameraSettingsToRun(host!, runId, settings)
      .then(response => {
        queryClient
          .invalidateQueries([host, 'runs', runId])
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
