import { useQueryClient } from 'react-query'

import { useHost, useCurrentMaintenanceRun } from '@opentrons/react-api-client'

import { useNotifyService } from './useNotifyService'

import type { UseQueryResult } from 'react-query'
import type { MaintenanceRun } from '@opentrons/api-client'
import type { QueryOptionsWithPolling } from './types'

export function useNotifyCurrentMaintenanceRun(
  options: QueryOptionsWithPolling<MaintenanceRun, Error>
): UseQueryResult<MaintenanceRun> | UseQueryResult<MaintenanceRun, Error> {
  const host = useHost()
  const queryKey = [host, 'maintenance_runs', 'current_run']
  const queryClient = useQueryClient()

  const {
    notifyQueryResponse,
    isNotifyError,
  } = useNotifyService<MaintenanceRun>({
    topic: 'robot-server/maintenance_runs',
    queryKey: queryKey,
    options: {
      ...options,
      onError: () => {
        queryClient.resetQueries(queryKey)
      },
    },
  })
  const isUsingNotifyData = !isNotifyError && !options.forceHttpPolling

  const httpQueryResult = useCurrentMaintenanceRun({
    ...options,
    enabled: host !== null && options.enabled !== false && !isUsingNotifyData,
  })

  return isUsingNotifyData ? notifyQueryResponse : httpQueryResult
}
