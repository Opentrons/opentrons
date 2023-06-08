import {
  HostConfig,
  getCurrentMaintenanceRun,
  MaintenanceRun,
} from '@opentrons/api-client'
import { useQuery, useQueryClient } from 'react-query'
import { useHost } from '../api'

import type { UseQueryResult, UseQueryOptions } from 'react-query'

export function useCurrentMaintenanceRun<TError = Error>(
  options: UseQueryOptions<MaintenanceRun, TError> = {}
): UseQueryResult<MaintenanceRun, TError> {
  const host = useHost()
  const queryClient = useQueryClient()

  const query = useQuery<MaintenanceRun, TError>(
    [host, 'maintenance_runs', 'current_run'],
    () =>
      getCurrentMaintenanceRun(host as HostConfig).then(
        response => response.data
      ),
    {
      ...options,
      enabled: host !== null && options.enabled !== false,
      onError: () => {
        queryClient.resetQueries([host, 'maintenance_runs', 'current_run'])
      },
    }
  )

  return query
}
