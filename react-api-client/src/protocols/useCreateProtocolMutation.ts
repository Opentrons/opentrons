import { useQueryClient } from 'react-query'

import { createProtocol } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  ErrorResponse,
  HostConfig,
  Protocol,
  RunTimeParameterFilesCreateData,
  RunTimeParameterValuesCreateData,
} from '@opentrons/api-client'
import type { DocumentationState } from '../accessControl'

export interface CreateProtocolVariables {
  files: File[]
  protocolKey?: string
  protocolKind?: string
  runTimeParameterValues?: RunTimeParameterValuesCreateData
  runTimeParameterFiles?: RunTimeParameterFilesCreateData
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
  documentationState: DocumentationState,
  options: UseCreateProtocolMutationOptions = {},
  hostOverride?: HostConfig | null
): UseCreateProtocolMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const queryClient = useQueryClient()

  const mutation = useDocumentedMutation<
    Protocol,
    AxiosError<ErrorResponse>,
    CreateProtocolVariables
  >(
    documentationState,
    ['create_protocol'],
    getQueryKey(host, 'protocols'),
    ({
      variables: {
        files: protocolFiles,
        protocolKey,
        protocolKind = 'standard',
        runTimeParameterValues,
        runTimeParameterFiles,
      },
      userNotes,
    }) =>
      createProtocol(
        host!,
        protocolFiles,
        protocolKey,
        protocolKind,
        runTimeParameterValues,
        runTimeParameterFiles,
        userNotes
      )
        .then(response => {
          const protocolId = response.data.data.id
          queryClient
            .invalidateQueries(getQueryKey(host, 'protocols'))
            .then(() =>
              queryClient.setQueryData(
                getQueryKey(host, 'protocols', protocolId),
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
