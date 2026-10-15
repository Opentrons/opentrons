import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useSelector } from 'react-redux'

import { useDismissCurrentRunMutation } from '@opentrons/react-api-client'

import { DocumentationRequiredModalContext } from '/app/local-resources/access-control/DocumentationRequiredModalContext'
import { useLinkedDocumentationState } from '/app/local-resources/access-control/useLinkedDocumentationState'
import { getIsOnDevice } from '/app/redux/config'
import { useCurrentRunId } from '/app/resources/runs'

import { useIsSigningRequired } from './useIsSigningRequired'

import type { AxiosError } from 'axios'
import type { Run } from '@opentrons/api-client'
import type { DocumentedAction } from '@opentrons/react-api-client'

type CloseCallback = (options?: CloseOptions) => void

interface CloseOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
  onSettled?: () => void
}

export function useCloseCurrentRun(): {
  closeCurrentRun: CloseCallback
  isClosingCurrentRun: boolean
} {
  const currentRunId = useCurrentRunId()
  const isOnDevice = useSelector(getIsOnDevice)

  const {
    isSigningRequired,
    isLoading: isSigningRequiredLoading,
    isDownloadingRequired,
    logPeriodId,
  } = useIsSigningRequired()

  const actionsToDocument: DocumentedAction[] = useMemo(
    () =>
      isSigningRequired
        ? isDownloadingRequired
          ? ['sign_run']
          : ['sign_run', 'dismiss_run']
        : ['dismiss_run'],
    [isSigningRequired, isDownloadingRequired]
  )
  const { documentationState } = useLinkedDocumentationState(
    actionsToDocument,
    currentRunId
  )

  const { dismissCurrentRun, isLoading: isDismissing } =
    useDismissCurrentRunMutation(documentationState)

  const { showSignRunModal, showDownloadLogsModal } = useContext(
    DocumentationRequiredModalContext
  )

  const isDismissInFlight = useRef(false)
  const lastDismissedRunId = useRef<string | null>(null)
  const closeRequestedRef = useRef(false)

  const [isClosePending, setIsClosePending] = useState(false)
  const isSignRunPending = useRef(false)
  const closeOptions = useRef<CloseOptions | undefined>(undefined)

  const resetClosePending = useCallback(() => {
    setIsClosePending(false)
    closeRequestedRef.current = false
    isSignRunPending.current = false
    closeOptions.current = undefined
    isDismissInFlight.current = false
  }, [])

  const closeCurrentRun = (options?: CloseOptions): void => {
    if (currentRunId == null || currentRunId === lastDismissedRunId.current) {
      options?.onSuccess?.()
      options?.onSettled?.()
      return
    }
    // A close is already in flight.
    // Attach the latest callbacks instead of settling early, othwerise we
    // navigate away while the run was still current.
    if (closeRequestedRef.current) {
      closeOptions.current = { ...closeOptions.current, ...options }
      return
    }
    closeRequestedRef.current = true
    isSignRunPending.current = false
    setIsClosePending(true)
    closeOptions.current = options
  }

  const handleDismiss = useCallback(async () => {
    isDismissInFlight.current = true

    if (currentRunId != null) {
      // on the ODD, if downloading is required, runs can now only be dismissed on the Desktop app.
      if (isOnDevice && isDownloadingRequired && logPeriodId != null) {
        await showDownloadLogsModal(logPeriodId)
          .then(downloaded => {
            if (!downloaded) {
              console.warn('failed to download logs')
              closeOptions.current?.onError?.(
                new Error('failed to download logs')
              )
            } else {
              closeOptions.current?.onSuccess?.()
            }
          })
          .catch((error: AxiosError) => {
            console.warn('failed to download logs')
            closeOptions.current?.onError?.(error)
          })
          .finally(() => {
            const settled = closeOptions.current?.onSettled
            resetClosePending()
            settled?.()
          })
        return
      }

      dismissCurrentRun(currentRunId, {
        onSuccess: (response: Run) => {
          lastDismissedRunId.current = response.data.id
          closeOptions.current?.onSuccess?.()
        },
        onError: (error: AxiosError) => {
          console.warn('failed to dismiss current run')
          closeOptions.current?.onError?.(error)
        },
        onSettled: () => {
          const settled = closeOptions.current?.onSettled
          resetClosePending()
          settled?.()
        },
      })
    } else {
      const opts = closeOptions.current
      resetClosePending()
      opts?.onSuccess?.()
      opts?.onSettled?.()
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
      void showSignRunModal(documentationState)
        .then(signed => {
          if (!signed) {
            const callerOptions = closeOptions.current ?? {}
            resetClosePending()
            callerOptions.onError?.(
              new Error(
                'Sign run modal resolved false while closing current run; signing is required before dismiss'
              )
            )
            return
          }
          void handleDismiss()
        })
        .catch((error: Error) => {
          const callerOptions = closeOptions.current ?? {}
          resetClosePending()
          callerOptions.onError?.(error)
        })
      return
    }
    void handleDismiss()
  }, [
    documentationState,
    handleDismiss,
    isClosePending,
    isSigningRequired,
    isSigningRequiredLoading,
    resetClosePending,
    showSignRunModal,
  ])

  const closeCurrentRunCallback = useCallback(closeCurrentRun, [currentRunId])

  return {
    closeCurrentRun: closeCurrentRunCallback,
    isClosingCurrentRun: isDismissing || isClosePending,
  }
}
