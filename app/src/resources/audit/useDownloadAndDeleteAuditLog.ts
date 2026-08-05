import { useState } from 'react'

import {
  useDeleteLogPeriodMutation,
  useLogPeriodDetailsQuery,
} from '@opentrons/react-api-client'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'

import { useUpdateClientDataLogDeletion } from '../client_data/audit'
import { useDownloadLogPeriod } from '../devices/hooks/useDownloadLogPeriod'

export function useDownloadAndDeleteAuditLog(
  logPeriodId: string,
  fileLocation: string
): {
  downloadAndDeleteAuditLog: () => Promise<void>
  isLoading: boolean
  error: Error | null
} {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

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
      const deletionKey = await downloadLogPeriod()
      if (deletionKey != null) {
        deleteLogPeriod(
          { logPeriodId, deletionKey },
          {
            onSuccess: () => {
              updateLogDeletionStatus('completed')
            },
          }
        )
      }
    } catch (error) {
      updateLogDeletionStatus('failed')
      setError(error as Error)
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
