import { useQueryClient } from 'react-query'
import {
  useHost,
  useRunQuery,
  useCreateRunMutation,
} from '@opentrons/react-api-client'

export function useCloneRun(runId: string | null): () => void {
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
  const cloneRun = (): void => {
    if (runRecord != null) {
      const { protocolId, labwareOffsets } = runRecord.data
      createRun({ protocolId, labwareOffsets })
    } else {
      console.info('failed to clone run record, source run record not found')
    }
  }

  return cloneRun
}
