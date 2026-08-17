import { useQuery, useQueryClient } from 'react-query'

import { getCurrentSubsystemUpdate } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type {
  Subsystem,
  SubsystemUpdateProgressData,
} from '@opentrons/api-client'

export function useCurrentSubsystemUpdateQuery<TError = Error>(
  subsystem: string | null,
  options: UseQueryOptions<SubsystemUpdateProgressData, TError> = {}
): UseQueryResult<SubsystemUpdateProgressData, TError> {
  const host = useHost()
  const queryClient = useQueryClient()
  const query = useQuery<SubsystemUpdateProgressData, TError>(
    getQueryKey(host, 'subsystems', 'updates', 'current', subsystem),
    () =>
      getCurrentSubsystemUpdate(host!, subsystem as Subsystem).then(
        response => response.data
      ),
    {
      enabled: host !== null,
      onError: () => {
        queryClient.setQueryData(
          getQueryKey(host, 'subsystems', 'updates', 'current', subsystem),
          undefined
        )
      },
      retry: false,
      ...options,
    }
  )

  return query
}
