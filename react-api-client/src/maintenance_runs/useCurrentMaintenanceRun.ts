import {
  HostConfig,
  getCurrentMaintenanceRun,
  MaintenanceRun,
} from '@opentrons/api-client'
import { useQuery, useQueryClient } from 'react-query'
import { useHost } from '../api'
import { getSanitizedQueryKeyObject } from '../utils'

import type { UseQueryResult, UseQueryOptions } from 'react-query'

export function useCurrentMaintenanceRun<TError = Error>(
  options: UseQueryOptions<MaintenanceRun, TError> = {}
): UseQueryResult<MaintenanceRun, TError> {
  const host = useHost()
  const queryClient = useQueryClient()
  const sanitizedHost = getSanitizedQueryKeyObject(host)

  const query = useQuery<MaintenanceRun, TError>(
    [sanitizedHost, 'maintenance_runs', 'current_run'],
    () =>
      getCurrentMaintenanceRun(host as HostConfig).then(
        response => response.data
      ),
    {
      enabled: host !== null && options.enabled !== false,
      onError: () => {
        queryClient.setQueryData(
          [sanitizedHost, 'maintenance_runs', 'current_run'],
          undefined
        )
      },
      retry: false,
      ...options,
    }
  )

  return query
}
