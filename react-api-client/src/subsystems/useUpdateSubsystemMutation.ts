import { updateSubsystem } from '@opentrons/api-client'
import type {
  HostConfig,
  Subsystem,
  SubsystemUpdateProgressData,
} from '@opentrons/api-client'
import type { AxiosError } from 'axios'
import { useMutation, useQueryClient } from 'react-query'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import { useHost } from '../api'

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
      updateSubsystem(host as HostConfig, subsystem).then(response => {
        queryClient.removeQueries([host, 'subsystems/updates'])
        queryClient
          .invalidateQueries([host, 'subsystems/updates'])
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
