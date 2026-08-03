import { useQueryClient } from 'react-query'

import { updateSubsystem } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
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
import type { DocumentationState } from '../accessControl'

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
  documentationState: DocumentationState,
  options: UseUpdateSubsystemMutationOptions = {}
): UseUpdateSubsystemMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useDocumentedMutation<
    SubsystemUpdateProgressData,
    AxiosError,
    Subsystem
  >(
    documentationState,
    ['update_subsystem'],
    ({ variables: subsystem, userNotes }) =>
      updateSubsystem(host!, subsystem, userNotes).then(response => {
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
