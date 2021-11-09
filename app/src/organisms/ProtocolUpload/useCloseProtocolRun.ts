import {
  useStopRunMutation,
  useDismissCurrentRunMutation,
} from '@opentrons/react-api-client'
import { useCurrentRunId } from './useCurrentRunId'

export function useCloseProtocolRun(): () => void {
  const currentRunId = useCurrentRunId()
  const { dismissCurrentRun } = useDismissCurrentRunMutation()

  const { stopRun } = useStopRunMutation({
    onSuccess: _data => {
      if (currentRunId != null) {
        dismissCurrentRun(currentRunId)
      }
    },
  })

  return () => currentRunId && stopRun(currentRunId)
}
