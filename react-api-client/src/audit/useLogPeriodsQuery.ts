import { useQuery } from 'react-query'

import { getLogPeriods } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { LogPeriodsResponse } from '@opentrons/api-client'

export function useLogPeriodsQuery(
  options: UseQueryOptions<LogPeriodsResponse> = {}
): UseQueryResult<LogPeriodsResponse> {
  const host = useHost()
  const query = useQuery<LogPeriodsResponse>(
    getQueryKey(host, 'audit', 'logPeriods'),
    () => getLogPeriods(host!).then(response => response.data),
    { enabled: host !== null, ...options }
  )
  return query
}
