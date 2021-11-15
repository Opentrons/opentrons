import {
  useStopRunMutation,
  useDismissCurrentRunMutation,
} from '@opentrons/react-api-client'
import { UseDismissCurrentRunMutationOptions } from '@opentrons/react-api-client/src/runs/useDismissCurrentRunMutation'
import { useDeleteRunMutation } from '../../../../../react-api-client/src/runs'
import { useCurrentProtocolRun } from './useCurrentProtocolRun'
import { useCurrentRunId } from './useCurrentRunId'
import type { RunStatus } from '@opentrons/api-client'

const isStoppedState = (status: RunStatus): boolean => {
  if (
    status === 'stop-requested' ||
    status === 'stopped' ||
    status === 'failed' ||
    status === 'succeeded'
  ) {
    return true
  }
  return false
}

export function useCloseCurrentRun(): (
  options?: UseDismissCurrentRunMutationOptions
) => void {
  const currentRunId = useCurrentRunId()
  const { dismissCurrentRun } = useDismissCurrentRunMutation()
  const { runRecord } = useCurrentProtocolRun()

  const { stopRun } = useStopRunMutation()
  const { deleteRun } = useDeleteRunMutation()

  return (options: UseDismissCurrentRunMutationOptions = {}) => {
    if (currentRunId != null) {
      const status = runRecord?.data.status
      if (isStoppedState(status as RunStatus)) {
        dismissCurrentRun(currentRunId, {
          // if we error when dismissing, delete the run
          onError: () => deleteRun(currentRunId),
        })
      } else {
        stopRun(currentRunId, {
          onSuccess: _data => {
            dismissCurrentRun(currentRunId, options)
          },
          // if we error when stopping, dismiss the run
          onError: () => {
            dismissCurrentRun(currentRunId, {
              // if we error when dismissing, delete the run
              onError: () => deleteRun(currentRunId),
            })
          },
        })
      }
    }
  }
}
