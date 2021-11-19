import { useRunActionMutations } from '@opentrons/react-api-client'
import { useCurrentRunId } from '../../../organisms/ProtocolUpload/hooks/useCurrentRunId'

interface CurrentRunControls {
  pauseRun: () => void
  stopRun: () => void
}

export function useCurrentRunControls(): CurrentRunControls {
  const currentRunId = useCurrentRunId()

  const { pauseRun, stopRun } = useRunActionMutations(currentRunId as string)

  return { pauseRun, stopRun }
}
