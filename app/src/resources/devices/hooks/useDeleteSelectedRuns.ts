import { useState } from 'react'
import { useQueryClient } from 'react-query'

import { deleteRun } from '@opentrons/api-client'
import { ERROR_TOAST } from '@opentrons/components'
import {
  getQueryKey,
  useDocumentedMutation,
  useHost,
} from '@opentrons/react-api-client'

// eslint-disable-next-line opentrons/no-imports-across-applications
import { useToaster } from '/app/organisms/ToasterOven'

import type { QueryKey } from 'react-query'
import type { RunData } from '@opentrons/api-client'
import type { DocumentationState } from '@opentrons/react-api-client'

interface UseDeleteSelectedRunsResult {
  deleteSelectedRuns: (
    runs: readonly RunData[],
    onSuccess?: () => void,
    onError?: () => void
  ) => void
  deletingIds: Set<string>
}

export function useDeleteSelectedRuns(
  documentationState: DocumentationState
): UseDeleteSelectedRunsResult {
  const host = useHost()
  const queryClient = useQueryClient()
  const { makeToast } = useToaster()
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

  const mutation = useDocumentedMutation<unknown, unknown, RunData[]>(
    documentationState,
    ['delete_runs'],
    ({ variables: runs, userNotes }) => {
      const currentHost = host
      if (currentHost == null || runs.length === 0) {
        return Promise.resolve()
      }

      let hasDeleteError = false
      return Promise.all(
        runs.map(run =>
          // deleteRun call is safe here within /app since we are wrapped in a useDocumentedMutation
          // eslint-disable-next-line opentrons/no-direct-mutating
          deleteRun(currentHost, run.id, userNotes).catch((e: Error) => {
            makeToast(e.message, ERROR_TOAST, { closeButton: true })
            hasDeleteError = true
          })
        )
      ).then(async () => {
        if (hasDeleteError) {
          throw new Error('One or more runs failed to delete')
        }
        const runsQueryKey: QueryKey = getQueryKey(currentHost, 'runs')
        await queryClient
          .invalidateQueries(runsQueryKey)
          .catch((e: Error) => {
            console.error(`error invalidating runs query: ${e.message}`)
          })
      })
    }
  )

  const deleteSelectedRuns = (
    runs: readonly RunData[],
    onSuccess?: () => void,
    onError?: () => void
  ): void => {
    if (host == null || runs.length === 0 || deletingIds.size > 0) {
      return
    }

    setDeletingIds(new Set(runs.map(run => run.id)))

    mutation.mutate([...runs], {
      onSettled: () => {
        setDeletingIds(new Set())
      },
      onSuccess,
      onError,
    })
  }

  return { deleteSelectedRuns, deletingIds }
}
