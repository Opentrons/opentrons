import {
  UseMutationResult,
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
  void
> & {
  createProtocol: UseMutateFunction<Protocol, unknown, void>
}

export function useCreateProtocolMutation(
  protocolFiles: File[]
): UseCreateProtocolMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<Protocol, unknown>([host, 'protocols'], () =>
    createProtocol(host as HostConfig, protocolFiles).then(response => {
      const protocolId = response.data.data.id
      queryClient.setQueryData([host, 'protocols', protocolId], response.data)
      return response.data
    })
  )
  return {
    ...mutation,
    createProtocol: mutation.mutate,
  }
}
