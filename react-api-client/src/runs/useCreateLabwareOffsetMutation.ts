import { useMutation, useQueryClient } from 'react-query'
import { createLabwareOffset, LabwareOffset } from '@opentrons/api-client'
import { useHost } from '../api'
import type { HostConfig, Run } from '@opentrons/api-client'
import type { UseMutationResult, UseMutateFunction } from 'react-query'

interface CreateLabwareOffsetParams {
  runId: string
  data: LabwareOffset
}

export type UseCreateLabwareofMutationResult = UseMutationResult<
  Run,
  unknown,
  CreateLabwareOffsetParams
> & {
  createLabwareOffset: UseMutateFunction<
    Run,
    unknown,
    CreateLabwareOffsetParams
  >
}

export function useCreateLabwareOffsetMutation(): UseCreateLabwareofMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<Run, unknown, CreateLabwareOffsetParams>(
    ({ runId, data }) =>
      createLabwareOffset(host as HostConfig, runId, data).then(response => {
        queryClient
          .invalidateQueries([host, 'runs'])
          .catch((e: Error) =>
            console.error(`error invalidating runs query: ${e.message}`)
          )
        return response.data
      })
  )

  return {
    ...mutation,
    createLabwareOffset: mutation.mutate,
  }
}
