import { useMutation, useQueryClient } from 'react-query'
import { createProtocol } from '@opentrons/api-client'
import { useHost } from '../api'
import type { AxiosError } from 'axios'
import type {
  UseMutationResult,
  UseMutationOptions,
  UseMutateFunction,
} from 'react-query'
import type {
  ErrorResponse,
  HostConfig,
  Protocol,
  RunTimeParameterCreateData,
} from '@opentrons/api-client'

export interface CreateProtocolVariables {
  files: File[]
  protocolKey?: string
  runTimeParameterValues?: RunTimeParameterCreateData
}
export type UseCreateProtocolMutationResult = UseMutationResult<
  Protocol,
  AxiosError<ErrorResponse>,
  CreateProtocolVariables
> & {
  createProtocol: UseMutateFunction<
    Protocol,
    AxiosError<ErrorResponse>,
    CreateProtocolVariables
  >
}

export type UseCreateProtocolMutationOptions = UseMutationOptions<
  Protocol,
  AxiosError<ErrorResponse>,
  CreateProtocolVariables
>

export function useCreateProtocolMutation(
  options: UseCreateProtocolMutationOptions = {},
  hostOverride?: HostConfig | null,
  runTimeParameterValues?: RunTimeParameterCreateData
): UseCreateProtocolMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const queryClient = useQueryClient()

  const mutation = useMutation<
    Protocol,
    AxiosError<ErrorResponse>,
    CreateProtocolVariables
  >(
    [host, 'protocols'],
    ({ files: protocolFiles, protocolKey }) =>
      createProtocol(
        host as HostConfig,
        protocolFiles,
        protocolKey,
        runTimeParameterValues
      )
        .then(response => {
          const protocolId = response.data.data.id
          queryClient
            .invalidateQueries([host, 'protocols'])
            .then(() =>
              queryClient.setQueryData(
                [host, 'protocols', protocolId],
                response.data
              )
            )
            .catch(e => {
              throw e
            })
          return response.data
        })
        .catch(e => {
          throw e
        }),
    options
  )
  return {
    ...mutation,
    createProtocol: mutation.mutate,
  }
}
