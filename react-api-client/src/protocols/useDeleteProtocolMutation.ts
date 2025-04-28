import { deleteProtocol } from '@opentrons/api-client'
import type { EmptyResponse, HostConfig } from '@opentrons/api-client'
import { useMutation, useQueryClient } from 'react-query'
import type { UseMutateFunction, UseMutationResult } from 'react-query'
import { useHost } from '../api'

export type UseDeleteProtocolMutationResult = UseMutationResult<
  EmptyResponse,
  unknown,
  void
> & {
  deleteProtocol: UseMutateFunction<EmptyResponse, unknown, void>
}

export function useDeleteProtocolMutation(
  protocolId: string
): UseDeleteProtocolMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<EmptyResponse, unknown>(() =>
    deleteProtocol(host as HostConfig, protocolId).then(response => {
      queryClient.invalidateQueries([host, 'protocols'])
      return response.data
    })
  )

  return {
    ...mutation,
    deleteProtocol: mutation.mutate,
  }
}
