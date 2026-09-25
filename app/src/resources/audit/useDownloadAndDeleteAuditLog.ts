import { useState } from 'react'
import { useDispatch } from 'react-redux'

import {
  isDocumentedMutationError,
  useDeleteLogPeriodMutation,
  useLogPeriodDetailsQuery,
} from '@opentrons/react-api-client'

import { useLinkedDocumentationState } from '/app/local-resources/access-control/useLinkedDocumentationState'
import { logPeriodDeleteStarted } from '/app/redux/audit'

import { useUpdateClientDataLogDeletion } from '../client_data/audit'
import { useDownloadLogPeriod } from '../devices/hooks/useDownloadLogPeriod'
import { useEnsureAuditLogAuthorization } from './useEnsureAuditLogAuthorization'

import type { DocumentedAction } from '@opentrons/react-api-client'
import type { Dispatch } from '/app/redux/types'

const DOWNLOAD_LOG_PERIOD_ACTIONS: DocumentedAction[] = ['download_log_period']

export function useDownloadAndDeleteAuditLog(logPeriodId: string): {
  downloadAndDeleteAuditLog: () => Promise<void>
  isLoading: boolean
  error: Error | null
} {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const dispatch = useDispatch<Dispatch>()

  const updateLogDeletionStatus = useUpdateClientDataLogDeletion(logPeriodId)

  const { documentationState } = useLinkedDocumentationState(
    DOWNLOAD_LOG_PERIOD_ACTIONS,
    logPeriodId
  )

  const logPeriodDetailsQuery = useLogPeriodDetailsQuery(logPeriodId)
  const logPeriodDetails = logPeriodDetailsQuery.data

  const { downloadLogPeriod } = useDownloadLogPeriod(logPeriodDetails)
  const { deleteLogPeriod } = useDeleteLogPeriodMutation(
    documentationState,
    DOWNLOAD_LOG_PERIOD_ACTIONS
  )
  const ensureAuthorized = useEnsureAuditLogAuthorization(
    documentationState,
    DOWNLOAD_LOG_PERIOD_ACTIONS
  )

  const downloadAndDeleteAuditLog = async (): Promise<void> => {
    setIsLoading(true)
    try {
      if (logPeriodDetails == null) {
        throw new Error(
          'Log period details not found for period ID: ' + logPeriodId
        )
      }
      await ensureAuthorized()
      updateLogDeletionStatus('pending')
      const deletionKey = await downloadLogPeriod()
      if (deletionKey == null) {
        throw new Error('Deletion key not found for period ID: ' + logPeriodId)
      }
      dispatch(logPeriodDeleteStarted({ logPeriodId }))
      await deleteLogPeriod({ logPeriodId, deletionKey })
      updateLogDeletionStatus('completed')
    } catch (error) {
      if (!isDocumentedMutationError(error)) {
        updateLogDeletionStatus('failed')
        setError(error as Error)
      }
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return {
    downloadAndDeleteAuditLog,
    isLoading,
    error,
  }
}
