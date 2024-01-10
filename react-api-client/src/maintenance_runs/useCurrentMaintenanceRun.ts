import { useQuery, useQueryClient } from 'react-query'

import {
  HostConfig,
  getCurrentMaintenanceRun,
  MaintenanceRun,
} from '@opentrons/api-client'

import { useHost } from '../api'
import { useNotifyService, hasNotifyServiceReceivedError } from '../api/notify'

import type { UseQueryResult } from 'react-query'
import type { QueryOptionsWithPolling } from '../api/notify'

export function useCurrentMaintenanceRun<Error>(
  options: QueryOptionsWithPolling<MaintenanceRun, Error> = {}
): UseQueryResult<MaintenanceRun, Error> {
  const host = useHost()
  const queryClient = useQueryClient()
  const queryKey = [host, 'maintenance_runs', 'current_run']

  // TOME: Need to type here so it returns MiantenenceRun data.
  const notifyData = useNotifyService({
    topic: 'robot-server/maintenance_runs',
    queryKey: queryKey,
    options,
  })
  const isNotifyError = hasNotifyServiceReceivedError(notifyData)
  const isUsingNotifyData = !isNotifyError && !options.forceHttpPolling
  if (isUsingNotifyData) queryClient.setQueryData(queryKey, notifyData)

  const queryFn = isUsingNotifyData
    ? () => notifyData
    : () =>
        getCurrentMaintenanceRun(host as HostConfig).then(
          response => response.data
        )
  // TOME: You might still get an issue with polling, which makes me think you don't use ANY query function in notify, but instead you
  // tweak options here.
  const query = useQuery<MaintenanceRun, Error>(queryKey, queryFn, {
    ...options,
    enabled: host !== null && options.enabled !== false,
    onError: () => {
      queryClient.resetQueries(queryKey)
    },
  })

  return query
}
