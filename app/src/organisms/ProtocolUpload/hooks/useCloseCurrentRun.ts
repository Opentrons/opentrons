import * as React from 'react'
import { useDismissCurrentRunMutation } from '@opentrons/react-api-client'
import { UseDismissCurrentRunMutationOptions } from '@opentrons/react-api-client/src/runs/useDismissCurrentRunMutation'
import { useCurrentProtocolRun } from './useCurrentProtocolRun'
import { useCurrentRunId } from './useCurrentRunId'

type CloseCallback = (options?: UseDismissCurrentRunMutationOptions) => void

export function useCloseCurrentRun(): {
  closeCurrentRun: CloseCallback
  isProtocolRunLoaded: boolean
} {
  const currentRunId = useCurrentRunId()
  const {
    dismissCurrentRun,
    isLoading: isDismissing,
  } = useDismissCurrentRunMutation()
  const { protocolRecord, runRecord } = useCurrentProtocolRun()

  const closeCurrentRun = (): void => {
    if (currentRunId != null) {
      dismissCurrentRun(currentRunId, {
        onError: () => console.warn('failed to dismiss current'),
      })
    }
  }
  const closeCurrentRunCallback = React.useCallback(closeCurrentRun, [
    dismissCurrentRun,
    runRecord,
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
