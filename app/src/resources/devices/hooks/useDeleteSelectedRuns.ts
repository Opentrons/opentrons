import { useState } from 'react'
import { useQueryClient } from 'react-query'

import { deleteRun } from '@opentrons/api-client'
import {
  getQueryKey,
  useDocumentedMutation,
  useHost,
} from '@opentrons/react-api-client'

import { isRunSignoffRequiredError } from '/app/local-resources/access-control/utils'

import type { QueryKey } from 'react-query'
import type { RunData } from '@opentrons/api-client'
import type { DocumentationState } from '@opentrons/react-api-client'

interface UseDeleteSelectedRunsResult {
  deleteSelectedRuns: (runs: readonly RunData[]) => Promise<void>
  deletingIds: Set<string>
}

export function useDeleteSelectedRuns(
  documentationState: DocumentationState
): UseDeleteSelectedRunsResult {
  const host = useHost()
  const queryClient = useQueryClient()
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

  const mutation = useDocumentedMutation<unknown, unknown, RunData[]>(
    documentationState,
    ['delete_runs'],
    ({ variables: runs, userNotes }) => {
      const currentHost = host
      if (currentHost == null || runs.length === 0) {
        return Promise.resolve()
      }

      const processSequentially = async (): Promise<void> => {
        let hasDeleteError = false
        let signoffRequiredError: Error | null = null
        // process one run at a time so deletions are applied sequentially
        // rather than concurrently, and a single failure doesn't abort the rest
        for (const run of runs) {
          // deleteRun call is safe here within /app since we are wrapped in a useDocumentedMutation
          // eslint-disable-next-line opentrons/no-direct-mutating
          await deleteRun(currentHost, run.id, userNotes).catch(error => {
            hasDeleteError = true
            if (
              signoffRequiredError == null &&
              error instanceof Error &&
              isRunSignoffRequiredError(error)
            ) {
              signoffRequiredError = error
            }
          })
        }

        if (signoffRequiredError != null) {
          await Promise.reject(signoffRequiredError)
        }
        if (hasDeleteError) {
          throw new Error('One or more runs failed to delete')
        }
        const runsQueryKey: QueryKey = getQueryKey(currentHost, 'runs')
        await queryClient.invalidateQueries(runsQueryKey).catch((e: Error) => {
          console.error(`error invalidating runs query: ${e.message}`)
        })
      }

      return processSequentially()
    }
  )

  const deleteSelectedRuns = (runs: readonly RunData[]): Promise<void> => {
    if (host == null || runs.length === 0 || deletingIds.size > 0) {
      return Promise.reject(
        new Error(
          'Unable to delete: no host, nothing selected, or a delete is already in progress.'
        )
      )
    }

    setDeletingIds(new Set(runs.map(run => run.id)))

    return mutation
      .mutateAsync([...runs], {
        onSettled: () => {
          setDeletingIds(new Set())
        },
      })
      .then(() => {})
  }

  return { deleteSelectedRuns, deletingIds }
}
