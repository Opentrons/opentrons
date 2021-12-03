import {
  UseMutationResult,
  UseMutationOptions,
  useMutation,
  UseMutateFunction,
  useQueryClient,
} from 'react-query'
import { createProtocol } from '@opentrons/api-client'
import { useHost } from '../api'
import type { HostConfig, Protocol } from '@opentrons/api-client'

export type UseCreateProtocolMutationResult = UseMutationResult<
  Protocol,
  unknown,
  File[]
> & {
  createProtocol: UseMutateFunction<Protocol, unknown, File[]>
  isLoading: boolean
}

export type UseCreateProtocolMutationOptions = UseMutationOptions<
  Protocol,
  unknown,
  File[]
>

export function useCreateProtocolMutation(
  options: UseCreateProtocolMutationOptions = {}
): UseCreateProtocolMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<Protocol, unknown, File[]>(
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
    isLoading: mutation.isLoading,
  }
}
