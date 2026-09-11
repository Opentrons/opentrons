import { useQueryClient } from 'react-query'

import { updateModule } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { useHost } from '../api'
import { modulesQueryKey } from './useModulesQuery'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { HostConfig, UpdateModuleResponse } from '@opentrons/api-client'
import type { DocumentationState } from '../accessControl'
import type { DocumentedMutationParameters } from '../accessControl/types'

export interface UpdateModuleErrorResponse {
  message?: string
}

export type UseUpdateModuleMutationResult = UseMutationResult<
  UpdateModuleResponse,
  AxiosError<UpdateModuleErrorResponse>,
  string
> & {
  updateModule: UseMutateFunction<
    UpdateModuleResponse,
    AxiosError<UpdateModuleErrorResponse>,
    string
  >
}

export type UseUpdateModuleMutationOptions = UseMutationOptions<
  UpdateModuleResponse,
  AxiosError<UpdateModuleErrorResponse>,
  string
>

export function useUpdateModuleMutation(
  documentationState: DocumentationState,
  options: UseUpdateModuleMutationOptions = {},
  hostOverride?: HostConfig | null
): UseUpdateModuleMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const queryClient = useQueryClient()

  const mutation = useDocumentedMutation<
    UpdateModuleResponse,
    AxiosError<UpdateModuleErrorResponse>,
    string
  >(
    documentationState,
    ['update_module'],
    modulesQueryKey(host),
    ({
      variables: serialNumber,
      userNotes,
    }: DocumentedMutationParameters<string>) =>
      updateModule(host!, serialNumber, userNotes).then(response => {
        queryClient
          .invalidateQueries(modulesQueryKey(host))
          .catch((e: Error) => {
            console.error(`error invalidating modules query: ${e.message}`)
          })
        return response.data
      }),
    options
  )

  return {
    ...mutation,
    updateModule: mutation.mutate,
  }
}
