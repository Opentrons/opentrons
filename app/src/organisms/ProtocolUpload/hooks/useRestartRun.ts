import { useDeleteRunMutation } from '@opentrons/react-api-client'
import { useCloneRun } from './useCloneRun'
import { useCloseCurrentRun } from './useCloseCurrentRun'
import { useMostRecentRunId } from './useMostRecentRunId'

export function useRestartRun(): () => void {
  const mostRecentRunId = useMostRecentRunId()
  const closeCurrentRun = useCloseCurrentRun()
  const { deleteRun } = useDeleteRunMutation()
  const { cloneRun } = useCloneRun(mostRecentRunId as string)

  return () => {
    if (mostRecentRunId != null) {
      closeCurrentRun({
        onSuccess: () => {
          deleteRun(mostRecentRunId, {
            onSuccess: () => {
              cloneRun()
            },
          })
        },
      })
    }
  }
}
