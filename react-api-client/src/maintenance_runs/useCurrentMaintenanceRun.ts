import {
  HostConfig,
  Run,
  getCurrentMaintenanceRun,
} from '@opentrons/api-client'
import { useQuery } from 'react-query'
import { useHost } from '../api'

import type { UseQueryResult, UseQueryOptions } from 'react-query'

export function useCurrentMaintenanceRun<TError = Error>(
  options: UseQueryOptions<Run, TError> = {}
): UseQueryResult<Run, TError> {
  const host = useHost()
  const query = useQuery<Run, TError>(
    [host, 'maintenance_runs', 'current_run'],
    () =>
      getCurrentMaintenanceRun(host as HostConfig).then(
        response => response.data
      ),
    {
      ...options,
      enabled: host !== null && options.enabled !== false,
    }
  )

  return query
}
