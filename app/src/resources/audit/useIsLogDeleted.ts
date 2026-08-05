import { useMemo } from 'react'

import { useLogPeriodDetailsQuery } from '@opentrons/react-api-client'

import { useClientDataLogDeletion } from '../client_data/audit/useClientDataLogDeletion'

export function useIsLogDeleted(logPeriodId: string): {
  isLoading: boolean
  isDeleted: boolean
  isError: boolean
} {
  const { isLoading, error } = useLogPeriodDetailsQuery(logPeriodId)

  const logDeletionStatus = useClientDataLogDeletion(logPeriodId)

  const isError = logDeletionStatus === 'failed'

  const isDeleted = useMemo(() => {
    if (error?.response?.status === 404 || logDeletionStatus === 'completed') {
      return true
    }

    return false
  }, [error?.response?.status, logDeletionStatus])

  return { isLoading, isDeleted, isError }
}
