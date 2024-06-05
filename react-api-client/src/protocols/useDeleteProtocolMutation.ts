import { useMutation, useQueryClient } from 'react-query'
import { deleteProtocol } from '@opentrons/api-client'
import { useHost } from '../api'
import { getSanitizedQueryKeyObject } from '../utils'
import type { UseMutationResult, UseMutateFunction } from 'react-query'
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
  const queryClient = useQueryClient()

  const mutation = useMutation<EmptyResponse, unknown>(() =>
    deleteProtocol(host as HostConfig, protocolId).then(response => {
      queryClient.invalidateQueries([
        getSanitizedQueryKeyObject(host),
        'protocols',
      ])
      return response.data
    })
  )

  return {
    ...mutation,
    deleteProtocol: mutation.mutate,
  }
}
