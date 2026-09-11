import { useMemo } from 'react'

import { useLogPeriodDetailsQuery } from '@opentrons/react-api-client'

import { useClientDataLogDeletion } from '../client_data/audit/useClientDataLogDeletion'

const IS_LOG_DELETED_POLL = 5000

export function useIsLogDeleted(logPeriodId: string): {
  isLoading: boolean
  isDeleted: boolean
  isError: boolean
} {
  const { isLoading, error } = useLogPeriodDetailsQuery(logPeriodId, {
    refetchInterval: IS_LOG_DELETED_POLL,
  })

  const logDeletionStatus = useClientDataLogDeletion(logPeriodId)

  const isError = logDeletionStatus === 'failed'

  const isDeleted = useMemo(() => {
    if (error?.response?.status === 404 || logDeletionStatus === 'completed') {
      return true
    }

    return false
  }, [error?.response?.status, logDeletionStatus])

  if (!logPeriodId) {
    return { isLoading: false, isDeleted: false, isError: true }
  }

  return { isLoading, isDeleted, isError }
}
