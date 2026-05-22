import { useMutation, useQueryClient } from 'react-query'

import { updateSubsystem } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  Subsystem,
  SubsystemUpdateProgressData,
} from '@opentrons/api-client'

export type UseUpdateSubsystemMutationResult = UseMutationResult<
  SubsystemUpdateProgressData,
  AxiosError,
  Subsystem
> & {
  updateSubsystem: UseMutateFunction<
    SubsystemUpdateProgressData,
    AxiosError,
    Subsystem
  >
}
export type UseUpdateSubsystemMutationOptions = UseMutationOptions<
  SubsystemUpdateProgressData,
  AxiosError,
  Subsystem
>

export function useUpdateSubsystemMutation(
  options: UseUpdateSubsystemMutationOptions = {}
): UseUpdateSubsystemMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<
    SubsystemUpdateProgressData,
    AxiosError,
    Subsystem
  >(
    (subsystem: Subsystem) =>
      updateSubsystem(host!, subsystem).then(response => {
        queryClient.removeQueries(getQueryKey(host, 'subsystems/updates'))
        queryClient
          .invalidateQueries(getQueryKey(host, 'subsystems/updates'))
          .catch((e: Error) => {
            console.error(`error invalidating subsystems query: ${e.message}`)
          })
        return response.data
      }),
    options
  )

  return {
    ...mutation,
    updateSubsystem: mutation.mutate,
  }
}
