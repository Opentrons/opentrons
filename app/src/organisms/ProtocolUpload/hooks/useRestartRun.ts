import { useCloneRun } from './useCloneRun'
import { useCloseCurrentRun } from './useCloseCurrentRun'
import { useMostRecentRunId } from './useMostRecentRunId'

/**
 * Custom React hook that returns a function to restart the most recent run.
 *
 * @returns {Function} The function to restart the most recent run.
 */
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
