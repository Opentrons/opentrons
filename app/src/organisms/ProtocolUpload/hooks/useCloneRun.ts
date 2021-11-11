import { useQueryClient } from 'react-query'
import {
  useHost,
  useRunQuery,
  useStopRunMutation,
  useCreateRunMutation,
} from '@opentrons/react-api-client'

export function useCloneRun(runId: string): () => void {
  const host = useHost()
  const queryClient = useQueryClient()
  const { data: runRecord } = useRunQuery(runId)
  const { createRun } = useCreateRunMutation({
    onSuccess: () => {
      queryClient
        .invalidateQueries([host, 'runs'])
        .catch((e: Error) =>
          console.error(`error invalidating runs query: ${e.message}`)
        )
    },
  })
  const { stopRun: stopThenCloneRun } = useStopRunMutation({
    onSuccess: _data => {
      if (runRecord != null) {
        const { protocolId, labwareOffsets } = runRecord.data
        createRun({ protocolId, labwareOffsets })
      }
    },
  })

  return () => stopThenCloneRun(runId)
}
