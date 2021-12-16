import * as React from 'react'
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

type CloseCallback = (options?: UseDismissCurrentRunMutationOptions) => void

export function useCloseCurrentRun(): {
  closeCurrentRun: CloseCallback
  isProtocolRunLoaded: boolean
} {
  const currentRunId = useCurrentRunId()
  const { protocolRecord, runRecord } = useCurrentProtocolRun()
  const {
    dismissCurrentRun,
    isLoading: isDismissing,
  } = useDismissCurrentRunMutation(protocolRecord?.data.id)

  const { stopRun } = useStopRunMutation()
  const { deleteRun } = useDeleteRunMutation()

  const closeCurrentRun = (
    options: UseDismissCurrentRunMutationOptions = {}
  ): void => {
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
  const closeCurrentRunCallback = React.useCallback(closeCurrentRun, [
    deleteRun,
    dismissCurrentRun,
    runRecord,
    stopRun,
    currentRunId,
  ])

  const analysisNotOk =
    protocolRecord?.data?.analyses[0] != null &&
    'result' in protocolRecord.data.analyses[0] &&
    protocolRecord.data.analyses[0].result === 'not-ok'

  return {
    closeCurrentRun: closeCurrentRunCallback,
    isProtocolRunLoaded:
      !isDismissing &&
      runRecord != null &&
      protocolRecord != null &&
      !analysisNotOk,
  }
}
