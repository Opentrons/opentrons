import { useCloneRun } from './useCloneRun'
import { useCloseCurrentRun } from './useCloseCurrentRun'
import { useMostRecentRunId } from './useMostRecentRunId'

import type { DocumentationState } from '@opentrons/react-api-client'

export function useRestartRun(
  documentationState: DocumentationState
): () => void {
  const mostRecentRunId = useMostRecentRunId()
  const { cloneRun } = useCloneRun(mostRecentRunId!)
  const { closeCurrentRun } = useCloseCurrentRun(documentationState)

  return () => {
    if (mostRecentRunId != null) {
      closeCurrentRun({
        onSuccess: () => {
          cloneRun()
        },
      })
    }
  }
}
