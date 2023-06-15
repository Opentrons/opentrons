import {
  HostConfig,
  SubsystemUpdateProgressData,
  getSubsystemUpdate,
  Subsystem,
} from '@opentrons/api-client'
import { useQuery } from 'react-query'
import { useHost } from '../api'

import type { UseQueryResult, UseQueryOptions } from 'react-query'

export function useSubsystemUpdateQuery<TError = Error>(
  subsystem: Subsystem,
  options: UseQueryOptions<SubsystemUpdateProgressData, TError> = {}
): UseQueryResult<SubsystemUpdateProgressData, TError> {
  const host = useHost()
  const query = useQuery<SubsystemUpdateProgressData, TError>(
    [host, 'subsystems/updates/current/', subsystem],
    () =>
      getSubsystemUpdate(host as HostConfig, subsystem).then(
        response => response.data
      ),
    {
      ...options,
      refetchInterval: 5000,
    }
  )

  return query
}
