import { useMutation, useQueryClient } from 'react-query'

import { deleteRunImages } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseMutateFunction, UseMutationResult } from 'react-query'
import type { EmptyResponse } from '@opentrons/api-client'

export type UseDeleteProtocolMutationResult = UseMutationResult<
  EmptyResponse,
  unknown,
  string
> & {
  deleteRunImages: UseMutateFunction<EmptyResponse, unknown, string>
}

export function useDeleteRunImages(): UseDeleteProtocolMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<EmptyResponse, unknown, string>(
    (runId: string) =>
      deleteRunImages(host!, runId).then(response => {
        queryClient.invalidateQueries(getQueryKey(host, 'dataFiles', runId))
        return response.data
      })
  )

  return {
    ...mutation,
    deleteRunImages: mutation.mutate,
  }
}
