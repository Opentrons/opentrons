import { useQueryClient } from 'react-query'
import {
  useHost,
  useRunQuery,
  useCreateRunMutation,
} from '@opentrons/react-api-client'

interface UseCloneRunResult {
  cloneRun: () => void
  isLoading: boolean
}

export function useCloneRun(runId: string | null): UseCloneRunResult {
  const host = useHost()
  const queryClient = useQueryClient()
  const { data: runRecord } = useRunQuery(runId)
  const { createRun, isLoading } = useCreateRunMutation({
    onSuccess: () => {
      queryClient
        .invalidateQueries([host, 'runs'])
        .catch((e: Error) =>
          console.error(`error invalidating runs query: ${e.message}`)
        )
    },
  })
  const cloneRun = (): void => {
    if (runRecord != null) {
      const { protocolId, labwareOffsets } = runRecord.data
      createRun({ protocolId, labwareOffsets })
    }
  }

  return { cloneRun, isLoading }
}
