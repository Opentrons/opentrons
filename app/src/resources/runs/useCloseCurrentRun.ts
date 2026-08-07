import { useCallback, useContext, useEffect, useRef, useState } from 'react'

import { useDismissCurrentRunMutation } from '@opentrons/react-api-client'

import { DocumentationRequiredModalContext } from '/app/local-resources/access-control/DocumentationRequiredModalContext'
import { useCurrentRunId } from '/app/resources/runs'

import { useIsSigningRequired } from './useIsSigningRequired'

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

  const { showSignRunModal } = useContext(DocumentationRequiredModalContext)

  const { isSigningRequired, isLoading: isSigningRequiredLoading } =
    useIsSigningRequired()

  const [isClosePending, setIsClosePending] = useState(false)
  const isSignRunPending = useRef(false)
  const closeOptions = useRef<UseDismissCurrentRunMutationOptions | undefined>(
    undefined
  )

  const resetClosePending = useCallback(() => {
    setIsClosePending(false)
    isSignRunPending.current = false
    closeOptions.current = undefined
  }, [])

  const closeCurrentRun = (
    options?: UseDismissCurrentRunMutationOptions
  ): void => {
    if (currentRunId != null && !isClosePending) {
      isSignRunPending.current = false
      setIsClosePending(true)
      closeOptions.current = options
    }
  }

  const handleDismiss = useCallback(() => {
    if (currentRunId != null) {
      const callerOptions = closeOptions.current ?? {}
      dismissCurrentRun(currentRunId, {
        ...callerOptions,
        onError: (error, ...args) => {
          console.warn('failed to dismiss current run')
          callerOptions.onError?.(error, ...args)
        },
        onSettled: (...args) => {
          resetClosePending()
          callerOptions.onSettled?.(...args)
        },
      })
    }
  }, [currentRunId, dismissCurrentRun, resetClosePending])

  useEffect(() => {
    if (isSigningRequiredLoading || !isClosePending) {
      return
    }

    if (isSigningRequired) {
      if (isSignRunPending.current) {
        return
      }
      isSignRunPending.current = true
      void showSignRunModal().then(signed => {
        if (!signed) {
          resetClosePending()
          throw new Error(
            'Sign run modal resolved false while closing current run; signing is required before dismiss'
          )
        }
        handleDismiss()
      })
      return
    }

    handleDismiss()
  }, [
    handleDismiss,
    isClosePending,
    isSigningRequired,
    isSigningRequiredLoading,
    resetClosePending,
    showSignRunModal,
  ])

  const closeCurrentRunCallback = useCallback(closeCurrentRun, [
    currentRunId,
    isClosePending,
  ])

  return {
    closeCurrentRun: closeCurrentRunCallback,
    isClosingCurrentRun: isDismissing || isClosePending,
  }
}
