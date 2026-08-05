import { useMemo } from 'react'

import { useLogPeriodDetailsQuery } from '@opentrons/react-api-client'

export function useIsLogDeleted(logPeriodId: string): {
  isLoading: boolean
  isDeleted: boolean
} {
  const { isLoading, error } = useLogPeriodDetailsQuery(logPeriodId)

  const isDeleted = useMemo(() => {
    if (error?.response?.status === 404) {
      return true
    }

    return false
  }, [error])

  return { isLoading, isDeleted }
}
