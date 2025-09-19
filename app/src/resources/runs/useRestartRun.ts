import { useCloneRun } from './useCloneRun'
import { useCloseCurrentRun } from './useCloseCurrentRun'
import { useMostRecentRunId } from './useMostRecentRunId'

export function useRestartRun(): () => void {
  const mostRecentRunId = useMostRecentRunId()
  const { cloneRun } = useCloneRun(mostRecentRunId as string)
  const { closeCurrentRun } = useCloseCurrentRun()

  return () => {
    if (mostRecentRunId != null) {
      closeCurrentRun({
        onSuccess: cloneRun,
      })
    }
  }
}
