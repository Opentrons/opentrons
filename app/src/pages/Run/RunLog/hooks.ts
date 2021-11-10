import { useRunActionMutations } from '@opentrons/react-api-client'
import { useCurrentRunId } from '../../../organisms/ProtocolUpload/useCurrentRunId'

interface CancelRun {
  usePause: () => void
  useStop: () => void
}

export function useCancelRun(): CancelRun {
  const currentRunId = useCurrentRunId()

  const { pauseRun, stopRun } = useRunActionMutations(currentRunId as string)

  const usePause = (): void => {
    pauseRun()
  }
  const useStop = (): void => {
    stopRun()
  }
  return { usePause, useStop }
}
