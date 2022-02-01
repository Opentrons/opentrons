import * as React from 'react'
import { useDismissCurrentRunMutation } from '@opentrons/react-api-client'
import { useCurrentRunId } from './useCurrentRunId'
import type { UseDismissCurrentRunMutationOptions } from '@opentrons/react-api-client/src/runs/useDismissCurrentRunMutation'

type CloseCallback = (options?: UseDismissCurrentRunMutationOptions) => void

export function useCloseCurrentRun(): {
  closeCurrentRun: CloseCallback
  isClosingCurrentRun: boolean
} {
  const currentRunId = useCurrentRunId()
  const {
    dismissCurrentRun,
    isLoading: isDismissing,
  } = useDismissCurrentRunMutation()

  const closeCurrentRun = (
    options?: UseDismissCurrentRunMutationOptions
  ): void => {
    if (currentRunId != null) {
      dismissCurrentRun(currentRunId, {
        ...options,
        onError: () => console.warn('failed to dismiss current'),
      })
    }
  }
  const closeCurrentRunCallback = React.useCallback(closeCurrentRun, [
    dismissCurrentRun,
    currentRunId,
  ])

  return {
    closeCurrentRun: closeCurrentRunCallback,
    isClosingCurrentRun: isDismissing,
  }
}
