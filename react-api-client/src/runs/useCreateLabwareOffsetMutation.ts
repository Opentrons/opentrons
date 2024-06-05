import { useMutation, useQueryClient } from 'react-query'
import { createLabwareOffset } from '@opentrons/api-client'
import { useHost } from '../api'
import { getSanitizedQueryKeyObject } from '../utils'
import type {
  HostConfig,
  Run,
  LabwareOffsetCreateData,
} from '@opentrons/api-client'
import type { UseMutationResult, UseMutateAsyncFunction } from 'react-query'

interface CreateLabwareOffsetParams {
  runId: string
  data: LabwareOffsetCreateData
}

export type UseCreateLabwareOffsetMutationResult = UseMutationResult<
  Run,
  unknown,
  CreateLabwareOffsetParams
> & {
  createLabwareOffset: UseMutateAsyncFunction<
    Run,
    unknown,
    CreateLabwareOffsetParams
  >
}

export function useCreateLabwareOffsetMutation(): UseCreateLabwareOffsetMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()
  const sanitizedHost = getSanitizedQueryKeyObject(host)

  const mutation = useMutation<Run, unknown, CreateLabwareOffsetParams>(
    ({ runId, data }) =>
      createLabwareOffset(sanitizedHost as HostConfig, runId, data)
        .then(response => {
          queryClient
            .invalidateQueries([sanitizedHost, 'runs'])
            .catch((e: Error) =>
              console.error(`error invalidating runs query: ${e.message}`)
            )
          return response.data
        })
        .catch((e: Error) => {
          console.error(`error creating labware offsets: ${e.message}`)
          throw e
        })
  )

  return {
    ...mutation,
    createLabwareOffset: mutation.mutateAsync,
  }
}
