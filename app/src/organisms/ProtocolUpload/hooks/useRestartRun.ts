import { useCloneRun } from './useCloneRun'
import { useCloseCurrentRun } from './useCloseCurrentRun'
import { useMostRecentRunId } from './useMostRecentRunId'

export function useRestartRun(): () => void {
  const mostRecentRunId = useMostRecentRunId()
  const { closeCurrentRun } = useCloseCurrentRun()
  const cloneRun = useCloneRun(mostRecentRunId as string)

  return () => {
    if (mostRecentRunId != null) {
      closeCurrentRun({
        onSuccess: cloneRun,
      })
    }
  }
}
