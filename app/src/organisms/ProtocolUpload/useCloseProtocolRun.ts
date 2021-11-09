import { useStopRunMutation } from '@opentrons/react-api-client'
import { useCurrentRunId } from './useCurrentRunId'

export function useCloseProtocolRun(): () => void {
  const currentRunId = useCurrentRunId()

  const { stopRun } = useStopRunMutation({
    onSuccess: _data => {
      if (currentRunId != null) {
        // TODO IMMEDIATELY PATCH run with current false
      }
    },
  })

  return () => currentRunId && stopRun(currentRunId)
}
