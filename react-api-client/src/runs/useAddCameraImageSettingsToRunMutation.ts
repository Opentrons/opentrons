import { useMutation, useQueryClient } from 'react-query'

import { addCameraImageSettingsToRun } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type { UseMutateFunction, UseMutationResult } from 'react-query'
import type {
  CameraImageSettings,
  CameraImageSettingsResponse,
  ErrorResponse,
} from '@opentrons/api-client'

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
  runId: string
): UseAddCameraImageSettingsToRunMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()
  const mutation = useMutation<
    CameraImageSettingsResponse,
    AxiosError<ErrorResponse>,
    CameraImageSettings
  >(settings =>
    addCameraImageSettingsToRun(host!, runId, settings)
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
