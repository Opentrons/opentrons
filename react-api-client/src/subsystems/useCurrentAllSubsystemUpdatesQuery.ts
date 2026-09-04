import { useQuery, useQueryClient } from 'react-query'

import { getCurrentAllSubsystemUpdates } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { CurrentSubsystemUpdates } from '@opentrons/api-client'

export function useCurrentAllSubsystemUpdatesQuery<TError = Error>(
  options: UseQueryOptions<CurrentSubsystemUpdates, TError> = {}
): UseQueryResult<CurrentSubsystemUpdates, TError> {
  const host = useHost()
  const queryClient = useQueryClient()
  const query = useQuery<CurrentSubsystemUpdates, TError>(
    getQueryKey(host, 'subsystems', 'updates', 'current'),
    () => getCurrentAllSubsystemUpdates(host!).then(response => response.data),
    {
      enabled: host !== null,
      onError: () => {
        queryClient.setQueryData(
          getQueryKey(host, 'subsystems', 'updates', 'current'),
          undefined
        )
      },
      retry: false,
      ...options,
    }
  )

  return query
}
