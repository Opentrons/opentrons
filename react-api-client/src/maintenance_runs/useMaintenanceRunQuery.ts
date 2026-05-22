import { useQuery } from 'react-query'

import { getMaintenanceRun } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { MaintenanceRun } from '@opentrons/api-client'

export function useMaintenanceRunQuery<TError = Error>(
  maintenanceRunId: string | null,
  options: UseQueryOptions<MaintenanceRun, TError> = {}
): UseQueryResult<MaintenanceRun, TError> {
  const host = useHost()
  const query = useQuery<MaintenanceRun, TError>(
    getQueryKey(host, 'maintenance_runs', maintenanceRunId, 'details'),
    () =>
      getMaintenanceRun(host!, maintenanceRunId!).then(
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
