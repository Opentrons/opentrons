import { useQuery, useQueryClient } from 'react-query'

import { getCurrentMaintenanceRun } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { MaintenanceRun } from '@opentrons/api-client'

export function useCurrentMaintenanceRun<TError = Error>(
  options: UseQueryOptions<MaintenanceRun, TError> = {}
): UseQueryResult<MaintenanceRun, TError> {
  const host = useHost()
  const queryClient = useQueryClient()

  const query = useQuery<MaintenanceRun, TError>(
    getQueryKey(host, 'maintenance_runs', 'current_run'),
    () => getCurrentMaintenanceRun(host!).then(response => response.data),
    {
      enabled: host !== null && options.enabled !== false,
      onError: () => {
        queryClient.setQueryData(
          getQueryKey(host, 'maintenance_runs', 'current_run'),
          undefined
        )
      },
      retry: false,
      ...options,
    }
  )

  return query
}
