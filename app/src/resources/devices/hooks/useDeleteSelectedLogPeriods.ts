import { useState } from 'react'
import { useQueryClient } from 'react-query'

import { deleteLogPeriod } from '@opentrons/api-client'
import {
  getQueryKey,
  useDocumentedMutation,
  useHost,
} from '@opentrons/react-api-client'

import type { QueryKey } from 'react-query'
import type { LogPeriodSummary } from '@opentrons/api-client'
import type { DocumentationState } from '@opentrons/react-api-client'

interface UseDeleteSelectedLogPeriodsResult {
  deleteSelectedLogPeriods: (
    logPeriods: readonly LogPeriodSummary[],
    deletionKeysByLogPeriodId: Record<string, string>
  ) => Promise<void>
  deletingIds: Set<string>
}

export function useDeleteSelectedLogPeriods(
  documentationState: DocumentationState
): UseDeleteSelectedLogPeriodsResult {
  const host = useHost()
  const queryClient = useQueryClient()
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

  const mutation = useDocumentedMutation<
    unknown,
    unknown,
    {
      logPeriods: LogPeriodSummary[]
      deletionKeysByLogPeriodId: Record<string, string>
    }
  >(
    documentationState,
    ['delete_log_periods'],
    ({ variables: { logPeriods, deletionKeysByLogPeriodId }, userNotes }) => {
      const currentHost = host
      if (currentHost == null || logPeriods.length === 0) {
        return Promise.resolve()
      }

      const processSequentially = async (): Promise<void> => {
        let hasDeleteError = false
        // process one logPeriod at a time so deletions are applied sequentially
        // rather than concurrently, and a single failure doesn't abort the rest
        // enforce deletion key is present for each deletion request
        for (const { id: logPeriodId } of logPeriods) {
          const deletionKey = deletionKeysByLogPeriodId[logPeriodId]
          if (deletionKey == null) {
            hasDeleteError = true
            continue
          }
          // deleteLogPeriod call is safe here within /app since we are wrapped in a useDocumentedMutation
          // eslint-disable-next-line opentrons/no-direct-mutating
          await deleteLogPeriod(
            currentHost,
            logPeriodId,
            { deletionKey },
            userNotes
          ).catch(_ => (hasDeleteError = true))
        }

        if (hasDeleteError) {
          throw new Error('One or more logPeriods failed to delete')
        }
        const logPeriodsQueryKey: QueryKey = getQueryKey(
          currentHost,
          'audit',
          'logPeriods'
        )
        await queryClient
          .invalidateQueries(logPeriodsQueryKey)
          .catch((e: Error) => {
            console.error(`error invalidating logPeriods query: ${e.message}`)
          })
      }

      return processSequentially()
    }
  )

  const deleteSelectedLogPeriods = (
    logPeriods: readonly LogPeriodSummary[],
    deletionKeysByLogPeriodId: Record<string, string>
  ): Promise<void> => {
    if (host == null || logPeriods.length === 0 || deletingIds.size > 0) {
      return Promise.reject(
        new Error(
          'Unable to delete: no host, nothing selected, or a delete is already in progress.'
        )
      )
    }

    setDeletingIds(new Set(logPeriods.map(logPeriod => logPeriod.id)))

    return mutation
      .mutateAsync(
        { logPeriods: [...logPeriods], deletionKeysByLogPeriodId },
        {
          onSettled: () => {
            setDeletingIds(new Set())
          },
        }
      )
      .then(() => {})
  }

  return { deleteSelectedLogPeriods, deletingIds }
}
