import {
  UseMutationResult,
  UseMutationOptions,
  useMutation,
  UseMutateFunction,
  useQueryClient,
} from 'react-query'
import { createProtocol } from '@opentrons/api-client'
import { useHost } from '../api'
import type { AxiosError } from 'axios'
import type { ErrorResponse, HostConfig, Protocol } from '@opentrons/api-client'

export type UseCreateProtocolMutationResult = UseMutationResult<
  Protocol,
  AxiosError<ErrorResponse>,
  File[]
> & {
  createProtocol: UseMutateFunction<Protocol, AxiosError<ErrorResponse>, File[]>
}

export type UseCreateProtocolMutationOptions = UseMutationOptions<
  Protocol,
  AxiosError<ErrorResponse>,
  File[]
>

export function useCreateProtocolMutation(
  options: UseCreateProtocolMutationOptions = {}
): UseCreateProtocolMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<Protocol, AxiosError<ErrorResponse>, File[]>(
    [host, 'protocols'],
    (protocolFiles: File[]) =>
      createProtocol(host as HostConfig, protocolFiles).then(response => {
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
            console.error(e)
          })
        return response.data
      }),
    options
  )
  return {
    ...mutation,
    createProtocol: mutation.mutate,
  }
}
