import { useMutation, useQueryClient } from 'react-query'

import { addCameraImageSettingsToRun } from '@opentrons/api-client'

import { useHost } from '../api'

import type { AxiosError } from 'axios'
import type { UseMutateFunction, UseMutationResult } from 'react-query'
import type {
  CameraResponse,
  CameraSettings,
  ErrorResponse,
} from '@opentrons/api-client'

export interface AddCameraImageSettingsToRunParams {
  runId: string
  settings: CameraSettings
}

export type UseAddCameraSettingsToRunMutationResult = UseMutationResult<
  CameraResponse,
  AxiosError<ErrorResponse>,
  AddCameraImageSettingsToRunParams
> & {
  addCameraImageSettingsToRun: UseMutateFunction<
    CameraResponse,
    AxiosError<ErrorResponse>,
    AddCameraImageSettingsToRunParams
  >
}

export function useAddCameraSettingsToRunMutation(): UseAddCameraSettingsToRunMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<
    CameraResponse,
    AxiosError<ErrorResponse>,
    AddCameraImageSettingsToRunParams
  >(({ runId, settings }) =>
    addCameraImageSettingsToRun(host!, runId, settings)
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
    addCameraImageSettingsToRun: mutation.mutate,
  }
}
