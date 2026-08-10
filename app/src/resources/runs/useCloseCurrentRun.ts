import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import { useDismissCurrentRunMutation } from '@opentrons/react-api-client'

import { DocumentationRequiredModalContext } from '/app/local-resources/access-control/DocumentationRequiredModalContext'
import { getIsOnDevice } from '/app/redux/config'
import { useCurrentRunId } from '/app/resources/runs'

import { useIsSigningRequired } from './useIsSigningRequired'

import type { AxiosError } from 'axios'
import type { Run } from '@opentrons/api-client'
import type { DocumentationState } from '@opentrons/react-api-client'

type CloseCallback = (options?: CloseOptions) => void

interface CloseOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
  onSettled?: () => void
}

export function useCloseCurrentRun(documentationState: DocumentationState): {
  closeCurrentRun: CloseCallback
  isClosingCurrentRun: boolean
} {
  const currentRunId = useCurrentRunId()
  const isOnDevice = useSelector(getIsOnDevice)

  const { dismissCurrentRun, isLoading: isDismissing } =
    useDismissCurrentRunMutation(documentationState)

  const { showSignRunModal, showDownloadLogsModal } = useContext(
    DocumentationRequiredModalContext
  )

  const isDismissInFlight = useRef(false)
  const lastDismissedRunId = useRef<string | null>(null)

  const {
    isSigningRequired,
    isLoading: isSigningRequiredLoading,
    isDownloadingRequired,
    logPeriodId,
  } = useIsSigningRequired()

  const [isClosePending, setIsClosePending] = useState(false)
  const isSignRunPending = useRef(false)
  const closeOptions = useRef<CloseOptions | undefined>(undefined)

  const resetClosePending = useCallback(() => {
    setIsClosePending(false)
    isSignRunPending.current = false
    closeOptions.current = undefined
    isDismissInFlight.current = false
  }, [])

  const closeCurrentRun = (options?: CloseOptions): void => {
    if (
      currentRunId != null &&
      !isClosePending &&
      // blocks callers trying to dismiss the same run again while queries load
      currentRunId !== lastDismissedRunId.current
    ) {
      isSignRunPending.current = false
      setIsClosePending(true)
      closeOptions.current = options
    }
  }

  const handleDismiss = useCallback(() => {
    isDismissInFlight.current = true
    const callerOptions = closeOptions.current ?? {}

    if (currentRunId != null) {
      // on the ODD, if downloading is required, runs can now only be dismissed on the Desktop app.
      if (isOnDevice && isDownloadingRequired && logPeriodId != null) {
        void showDownloadLogsModal(logPeriodId)
          .then(downloaded => {
            if (!downloaded) {
              console.warn('failed to download logs')
              callerOptions.onError?.(new Error('failed to download logs'))
            } else {
              callerOptions.onSuccess?.()
            }
          })
          .catch((error: AxiosError) => {
            console.warn('failed to download logs')
            callerOptions.onError?.(error)
          })
          .finally(() => {
            callerOptions.onSettled?.()
            resetClosePending()
          })
        return
      }

      dismissCurrentRun(currentRunId, {
        ...callerOptions,
        onSuccess: (response: Run, ...args) => {
          lastDismissedRunId.current = response.data.id
          callerOptions.onSuccess?.()
        },
        onError: async (error: AxiosError) => {
          console.warn('failed to dismiss current run')
          callerOptions.onError?.(error)
        },
        onSettled: () => {
          resetClosePending()
          callerOptions.onSettled?.()
        },
      })
    } else {
      resetClosePending()
    }
  }, [
    currentRunId,
    logPeriodId,
    dismissCurrentRun,
    resetClosePending,
    isDownloadingRequired,
    showDownloadLogsModal,
    isOnDevice,
  ])

  useEffect(() => {
    if (
      isSigningRequiredLoading ||
      !isClosePending ||
      isDismissInFlight.current
    ) {
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
