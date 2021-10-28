import {
  UseMutationResult,
  useMutation,
  UseMutateFunction,
  useQueryClient,
} from 'react-query'
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
  const queryClient = useQueryClient()

  const mutation = useMutation<EmptyResponse, unknown>(() =>
    deleteProtocol(host as HostConfig, protocolId).then(response => {
      queryClient.invalidateQueries([host, 'protocols', protocolId])
      return response.data
    })
  )

  return {
    ...mutation,
    deleteProtocol: mutation.mutate,
  }
}
