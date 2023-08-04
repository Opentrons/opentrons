import { useQuery } from 'react-query'

import { getCurrentSubsystemUpdates } from '@opentrons/api-client'
import { useHost } from '../api'

import type { UseQueryResult, UseQueryOptions } from 'react-query'
import type {
  CurrentSubsystemUpdates,
  HostConfig,
  SubsystemUpdateProgressData,
} from '@opentrons/api-client'

export function useCurrentSubsystemUpdateQuery<TError = Error>(
  subsystem: string | null,
  options: UseQueryOptions<
    CurrentSubsystemUpdates | SubsystemUpdateProgressData,
    TError
  > = {}
): UseQueryResult<
  CurrentSubsystemUpdates | SubsystemUpdateProgressData,
  TError
> {
  const host = useHost()
  const query = useQuery<
    CurrentSubsystemUpdates | SubsystemUpdateProgressData,
    TError
  >(
    [host, '/subsystems/updates/current', subsystem],
    () =>
      getCurrentSubsystemUpdates(host as HostConfig, subsystem as string).then(
        response => response.data
      ),
    {
      ...options,
      enabled: host !== null && subsystem != null && options.enabled !== false,
    }
  )

  return query
}
