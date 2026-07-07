import { useCallback } from 'react'

import { useDismissCurrentRunMutation } from '@opentrons/react-api-client'

import { useCurrentRunId } from '/app/resources/runs'

import type { DocumentationState } from '@opentrons/react-api-client'
import type { UseDismissCurrentRunMutationOptions } from '@opentrons/react-api-client/src/runs/useDismissCurrentRunMutation'

type CloseCallback = (options?: UseDismissCurrentRunMutationOptions) => void

export function useCloseCurrentRun(documentationState: DocumentationState): {
  closeCurrentRun: CloseCallback
  isClosingCurrentRun: boolean
} {
  const currentRunId = useCurrentRunId()

  const { dismissCurrentRun, isLoading: isDismissing } =
    useDismissCurrentRunMutation(documentationState)

  const closeCurrentRun = (
    options?: UseDismissCurrentRunMutationOptions
  ): void => {
    if (currentRunId != null) {
      dismissCurrentRun(currentRunId, {
        onError: () => {
          console.warn('failed to dismiss current')
        },
        ...options,
      })
    }
  }

  const closeCurrentRunCallback = useCallback(closeCurrentRun, [
    dismissCurrentRun,
    currentRunId,
  ])

  return {
    closeCurrentRun: closeCurrentRunCallback,
    isClosingCurrentRun: isDismissing,
  }
}
