import { useQuery } from 'react-query'

import { getSubsystemUpdate } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { SubsystemUpdateProgressData } from '@opentrons/api-client'

export function useSubsystemUpdateQuery<TError = Error>(
  updateId: string | null,
  options: UseQueryOptions<SubsystemUpdateProgressData, TError> = {}
): UseQueryResult<SubsystemUpdateProgressData, TError> {
  const host = useHost()
  const query = useQuery<SubsystemUpdateProgressData, TError>(
    getQueryKey(host, 'subsystems', 'updates', 'all', updateId),
    () => getSubsystemUpdate(host!, updateId!).then(response => response.data),
    {
      ...options,
      enabled: updateId != null,
      refetchInterval: 2000,
    }
  )

  return query
}
