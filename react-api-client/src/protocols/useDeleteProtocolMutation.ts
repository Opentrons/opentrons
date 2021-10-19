import { UseMutationResult, useMutation, UseMutateFunction } from 'react-query'
import { deleteProtocol } from '@opentrons/api-client'
import { useHost } from '../api'
import type { HostConfig, EmptyResponse } from '@opentrons/api-client'

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
  const mutation = useMutation<EmptyResponse, unknown>(
    ['protocols', host],
    () =>
      deleteProtocol(host as HostConfig, protocolId).then(
        response => response.data
      )
  )
  return {
    ...mutation,
    deleteProtocol: mutation.mutate,
  }
}
