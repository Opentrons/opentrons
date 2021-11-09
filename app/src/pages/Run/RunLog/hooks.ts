import {
  useAllRunsQuery,
  useRunActionMutations,
} from '@opentrons/react-api-client'

interface CancelRun {
  usePause: () => void
  useStop: () => void
}

export function useCancelRun(): CancelRun {
  // TODO: use first run temporarily
  const { data: runsData } = useAllRunsQuery()
  const currentRunId = runsData?.data[0].id as string

  const { pauseRun, stopRun } = useRunActionMutations(currentRunId)

  const usePause = (): void => {
    pauseRun()
  }
  const useStop = (): void => {
    stopRun()
  }
  return { usePause, useStop }
}
