import { getCurrentAllSubsystemUpdates } from '@opentrons/api-client'
import type { CurrentSubsystemUpdates, HostConfig } from '@opentrons/api-client'
import { useQuery, useQueryClient } from 'react-query'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import { useHost } from '../api'

export function useCurrentAllSubsystemUpdatesQuery<TError = Error>(
  options: UseQueryOptions<CurrentSubsystemUpdates, TError> = {}
): UseQueryResult<CurrentSubsystemUpdates, TError> {
  const host = useHost()
  const queryClient = useQueryClient()
  const query = useQuery<CurrentSubsystemUpdates, TError>(
    [host, '/subsystems/updates/current'],
    () =>
      getCurrentAllSubsystemUpdates(host as HostConfig).then(
        response => response.data
      ),
    {
      enabled: host !== null,
      onError: () => {
        queryClient.setQueryData(
          [host, '/subsystems/updates/current'],
          undefined
        )
      },
      retry: false,
      ...options,
    }
  )

  return query
}
