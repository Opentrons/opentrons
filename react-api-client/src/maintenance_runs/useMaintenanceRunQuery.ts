import {
  HostConfig,
  MaintenanceRun,
  getMaintenanceRun,
} from '@opentrons/api-client'
import { useQuery } from 'react-query'
import { useHost } from '../api'

import type { UseQueryResult, UseQueryOptions } from 'react-query'

export function useMaintenanceRunQuery<TError = Error>(
  maintenanceRunId: string | null,
  options: UseQueryOptions<MaintenanceRun, TError> = {}
): UseQueryResult<MaintenanceRun, TError> {
  const host = useHost()
  const query = useQuery<MaintenanceRun, TError>(
    [host, 'maintenance_runs', maintenanceRunId, 'details'],
    () =>
      getMaintenanceRun(host as HostConfig, maintenanceRunId as string).then(
        response => response.data
      ),
    {
      ...options,
      enabled:
        host !== null && maintenanceRunId != null && options.enabled !== false,
    }
  )

  return query
}
