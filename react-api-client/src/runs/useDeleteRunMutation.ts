import {
  UseMutationResult,
  useMutation,
  UseMutateFunction,
  useQueryClient,
} from 'react-query'
import { deleteRun } from '@opentrons/api-client'
import { useHost } from '../api'
import type { HostConfig, EmptyResponse } from '@opentrons/api-client'

export type UseDeleteRunMutationResult = UseMutationResult<
  EmptyResponse,
  unknown,
  string
> & {
  deleteRun: UseMutateFunction<EmptyResponse, unknown, string>
}

export function useDeleteRunMutation(): UseDeleteRunMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<EmptyResponse, unknown, string>(
    (runId: string) =>
      deleteRun(host as HostConfig, runId).then(response => {
        queryClient.invalidateQueries([host, 'runs', runId])
        return response.data
      })
  )

  return {
    ...mutation,
    deleteRun: mutation.mutate,
  }
}
