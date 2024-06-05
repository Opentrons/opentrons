import { useQuery, useQueryClient } from 'react-query'

import { getCurrentAllSubsystemUpdates } from '@opentrons/api-client'
import { useHost } from '../api'

import type { UseQueryResult, UseQueryOptions } from 'react-query'
import type { CurrentSubsystemUpdates, HostConfig } from '@opentrons/api-client'
import { getSanitizedQueryKeyObject } from '../utils'

export function useCurrentAllSubsystemUpdatesQuery<TError = Error>(
  options: UseQueryOptions<CurrentSubsystemUpdates, TError> = {}
): UseQueryResult<CurrentSubsystemUpdates, TError> {
  const host = useHost()
  const sanitizedHost = getSanitizedQueryKeyObject(host)
  const queryClient = useQueryClient()
  const query = useQuery<CurrentSubsystemUpdates, TError>(
    [sanitizedHost, '/subsystems/updates/current'],
    () =>
      getCurrentAllSubsystemUpdates(host as HostConfig).then(
        response => response.data
      ),
    {
      enabled: host !== null,
      onError: () => {
        queryClient.setQueryData(
          [sanitizedHost, '/subsystems/updates/current'],
          undefined
        )
      },
      retry: false,
      ...options,
    }
  )

  return query
}
