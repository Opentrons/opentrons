import { useState } from 'react'
import { useQueryClient } from 'react-query'

import { deleteRun } from '@opentrons/api-client'
import { ERROR_TOAST } from '@opentrons/components'
import {
  getQueryKey,
  useDocumentedMutation,
  useHost,
} from '@opentrons/react-api-client'

import { useToaster } from '/app/organisms/ToasterOven'

import type { RunData } from '@opentrons/api-client'
import type { DocumentationState } from '@opentrons/react-api-client'

interface UseDeleteSelectedRunsResult {
  deleteSelectedRuns: (runs: RunData[]) => void
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

      return Promise.all(
        runs.map(run =>
          deleteRun(currentHost, run.id, userNotes).catch((e: Error) =>
            makeToast(e.message, ERROR_TOAST, { closeButton: true })
          )
        )
      )
        .then(() =>
          queryClient
            .invalidateQueries(getQueryKey(currentHost, 'runs'))
            .catch((e: Error) => {
              console.error(`error invalidating runs query: ${e.message}`)
            })
        )
        .catch((e: Error) => {
          makeToast(e.message, ERROR_TOAST, { closeButton: true })
        })
    }
  )

  const deleteSelectedRuns = (runs: RunData[]): void => {
    if (host == null || runs.length === 0 || deletingIds.size > 0) {
      return
    }

    setDeletingIds(new Set(runs.map(run => run.id)))

    mutation.mutate(runs, {
      onSettled: () => {
        setDeletingIds(new Set())
      },
    })
  }

  return { deleteSelectedRuns, deletingIds }
}
