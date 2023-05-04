import { useHost } from '../api'
import { deleteProtocol } from '@opentrons/api-client'
import type { HostConfig, EmptyResponse } from '@opentrons/api-client'
import {
  UseMutationResult,
  useMutation,
  UseMutateFunction,
  useQueryClient,
} from 'react-query'

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
