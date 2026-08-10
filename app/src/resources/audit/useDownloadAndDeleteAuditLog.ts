import { useState } from 'react'
import { useDispatch } from 'react-redux'

import {
  useDeleteLogPeriodMutation,
  useLogPeriodDetailsQuery,
} from '@opentrons/react-api-client'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { logPeriodDeleteStarted } from '/app/redux/audit'

import { useUpdateClientDataLogDeletion } from '../client_data/audit'
import { useDownloadLogPeriod } from '../devices/hooks/useDownloadLogPeriod'

import type { Dispatch } from '/app/redux/types'

export function useDownloadAndDeleteAuditLog(logPeriodId: string): {
  downloadAndDeleteAuditLog: () => Promise<void>
  isLoading: boolean
  error: Error | null
} {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const dispatch = useDispatch<Dispatch>()

  const updateLogDeletionStatus = useUpdateClientDataLogDeletion(logPeriodId)

  const documentationState = useDocumentationState()

  const logPeriodDetailsQuery = useLogPeriodDetailsQuery(logPeriodId)
  const logPeriodDetails = logPeriodDetailsQuery.data

  const { downloadLogPeriod } = useDownloadLogPeriod(logPeriodDetails)
  const { deleteLogPeriod } = useDeleteLogPeriodMutation(documentationState, [
    'download_log_period',
  ])

  const downloadAndDeleteAuditLog = async (): Promise<void> => {
    setIsLoading(true)
    updateLogDeletionStatus('pending')
    try {
      if (logPeriodDetails == null) {
        throw new Error(
          'Log period details not found for period ID: ' + logPeriodId
        )
      }
      const deletionKey = await downloadLogPeriod()
      if (deletionKey == null) {
        throw new Error('Deletion key not found for period ID: ' + logPeriodId)
      }
      dispatch(logPeriodDeleteStarted({ logPeriodId }))
      await deleteLogPeriod({ logPeriodId, deletionKey })
      updateLogDeletionStatus('completed')
    } catch (error) {
      updateLogDeletionStatus('failed')
      setError(error as Error)
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
