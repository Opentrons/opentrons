import { useMutation, useQueryClient } from 'react-query'

import { deleteProtocol } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseMutateFunction, UseMutationResult } from 'react-query'
import type { EmptyResponse } from '@opentrons/api-client'

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

  // Directly calling useMutation is deprecated in the codebase. Update this to useDocumentedMutation before using this hook.
  // eslint-disable-next-line opentrons/no-direct-use-mutation
  const mutation = useMutation<EmptyResponse, unknown>(() =>
    deleteProtocol(host!, protocolId).then(response => {
      queryClient.invalidateQueries(getQueryKey(host, 'protocols'))
      return response.data
    })
  )

  return {
    ...mutation,
    deleteProtocol: mutation.mutate,
  }
}
