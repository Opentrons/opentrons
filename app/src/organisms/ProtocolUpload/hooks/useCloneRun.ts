import { useQueryClient } from 'react-query'
import {
  useHost,
  useRunQuery,
  useCreateRunMutation,
} from '@opentrons/react-api-client'

import type { Run } from '@opentrons/api-client'

interface UseCloneRunResult {
  cloneRun: () => void
  isLoading: boolean
}

/**
 * Hook that returns a function to clone a given run along with a loading state
 * @param {string | null} runId - The ID of the run to clone
 * @param {function} [onSuccessCallback] - An optional callback function that will be called when the run is successfully cloned
 * @returns {{ cloneRun: function, isLoading: boolean }} - An object with a function to clone the run and a boolean indicating if the mutation is loading
 */
export function useCloneRun(
  runId: string | null,
  onSuccessCallback?: (createRunResponse: Run) => unknown
): UseCloneRunResult {
  const host = useHost()
  const queryClient = useQueryClient()
  const { data: runRecord } = useRunQuery(runId)
  const { createRun, isLoading } = useCreateRunMutation({
    onSuccess: response => {
      queryClient
        .invalidateQueries([host, 'runs'])
        .catch((e: Error) =>
          console.error(`error invalidating runs query: ${e.message}`)
        )
      if (onSuccessCallback != null) onSuccessCallback(response)
    },
  })
  const cloneRun = (): void => {
    if (runRecord != null) {
      const { protocolId, labwareOffsets } = runRecord.data
      createRun({ protocolId, labwareOffsets })
    } else {
      console.info('failed to clone run record, source run record not found')
    }
  }

  return { cloneRun, isLoading }
}
