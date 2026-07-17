import { useMutation, useQueryClient } from 'react-query'

import { addCameraSettingsToRun } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type { UseMutateFunction, UseMutationResult } from 'react-query'
import type {
  CameraData,
  CameraResponse,
  ErrorResponse,
} from '@opentrons/api-client'

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

export function useAddCameraSettingsToRunMutation(): UseAddCameraSettingsToRunMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<
    CameraResponse,
    AxiosError<ErrorResponse>,
    AddCameraSettingsToRunParams
  >(({ runId, settings }) =>
    addCameraSettingsToRun(host!, runId, settings)
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
