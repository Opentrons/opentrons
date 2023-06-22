import {
  HostConfig,
  SubsystemUpdateProgressData,
  getSubsystemUpdate,
} from '@opentrons/api-client'
import { useQuery } from 'react-query'
import { useHost } from '../api'

import type { UseQueryResult, UseQueryOptions } from 'react-query'

export function useSubsystemUpdateQuery<TError = Error>(
  updateId: string | null,
  options: UseQueryOptions<SubsystemUpdateProgressData, TError> = {}
): UseQueryResult<SubsystemUpdateProgressData, TError> {
  const host = useHost()
  const query = useQuery<SubsystemUpdateProgressData, TError>(
    [host, 'subsystems/updates/all/', updateId],
    () =>
      getSubsystemUpdate(host as HostConfig, updateId as string).then(
        response => response.data
      ),
    {
      ...options,
      enabled: updateId != null,
      refetchInterval: 2000,
    }
  )

  return query
}
