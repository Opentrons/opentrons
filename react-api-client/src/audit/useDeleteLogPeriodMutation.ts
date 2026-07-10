import { useMutation, useQueryClient } from 'react-query'

import { deleteLogPeriod } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { EmptyResponse } from '@opentrons/api-client'

export interface DeleteLogPeriodParams {
  logPeriodId: string
  deletionKey: string
}

// TODO(nd, 2026-07-09): mirrors the TODO in deleteLogPeriod.ts — drop
// EmptyResponse here too if the real server response shape differs.
export type UseDeleteLogPeriodMutationResult = UseMutationResult<
  EmptyResponse,
  unknown,
  DeleteLogPeriodParams
> & {
  deleteLogPeriod: UseMutateFunction<
    EmptyResponse,
    unknown,
    DeleteLogPeriodParams
  >
}

export type UseDeleteLogPeriodMutationOptions = UseMutationOptions<
  EmptyResponse,
  unknown,
  DeleteLogPeriodParams
>

export function useDeleteLogPeriodMutation(
  options: UseDeleteLogPeriodMutationOptions = {}
): UseDeleteLogPeriodMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<EmptyResponse, unknown, DeleteLogPeriodParams>(
    ({ logPeriodId, deletionKey }) =>
      deleteLogPeriod(host!, logPeriodId, { deletionKey }).then(response => {
        queryClient
          .invalidateQueries(getQueryKey(host, 'audit', 'logPeriods'))
          .catch((e: Error) => {
            console.error(`error invalidating logPeriods query: ${e.message}`)
          })
        return response.data
      }),
    options
  )

  return {
    ...mutation,
    deleteLogPeriod: mutation.mutate,
  }
}
