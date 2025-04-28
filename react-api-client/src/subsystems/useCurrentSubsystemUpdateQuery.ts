import { getCurrentSubsystemUpdate } from '@opentrons/api-client'
import type {
  HostConfig,
  Subsystem,
  SubsystemUpdateProgressData,
} from '@opentrons/api-client'
import { useQuery, useQueryClient } from 'react-query'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import { useHost } from '../api'

export function useCurrentSubsystemUpdateQuery<TError = Error>(
  subsystem: string | null,
  options: UseQueryOptions<SubsystemUpdateProgressData, TError> = {}
): UseQueryResult<SubsystemUpdateProgressData, TError> {
  const host = useHost()
  const queryClient = useQueryClient()
  const query = useQuery<SubsystemUpdateProgressData, TError>(
    [host, '/subsystems/updates/current', subsystem],
    () =>
      getCurrentSubsystemUpdate(
        host as HostConfig,
        subsystem as Subsystem
      ).then(response => response.data),
    {
      enabled: host !== null,
      onError: () => {
        queryClient.setQueryData(
          [host, '/subsystems/updates/current', subsystem],
          undefined
        )
      },
      retry: false,
      ...options,
    }
  )

  return query
}
