import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from 'react-query'

import { deleteRun } from '@opentrons/api-client'
import { ERROR_TOAST } from '@opentrons/components'
import { getQueryKey, useHost } from '@opentrons/react-api-client'

import { useToaster } from '/app/organisms/ToasterOven'

import type { RunData } from '@opentrons/api-client'

interface UseDeleteSelectedRunsResult {
  deleteSelectedRuns: (runs: RunData[]) => void
  deletingIds: Set<string>
}

export function useDeleteSelectedRuns(): UseDeleteSelectedRunsResult {
  const host = useHost()
  const queryClient = useQueryClient()
  const { makeToast } = useToaster()
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const isMounted = useRef(false)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const deleteSelectedRuns = (runs: RunData[]): void => {
    if (host == null || runs.length === 0 || deletingIds.size > 0) {
      return
    }

    setDeletingIds(new Set(runs.map(run => run.id)))

    Promise.all(
      runs.map(run =>
        deleteRun(host, run.id).catch((e: Error) =>
          makeToast(e.message, ERROR_TOAST, { closeButton: true })
        )
      )
    )
      .then(() =>
        queryClient
          .invalidateQueries(getQueryKey(host, 'runs'))
          .catch((e: Error) => {
            console.error(`error invalidating runs query: ${e.message}`)
          })
      )
      .then(() => {
        if (isMounted.current) setDeletingIds(new Set())
      })
      .catch((e: Error) => {
        makeToast(e.message, ERROR_TOAST, { closeButton: true })
        if (isMounted.current) setDeletingIds(new Set())
      })
  }

  return { deleteSelectedRuns, deletingIds }
}
