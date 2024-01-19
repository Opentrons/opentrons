import * as React from 'react'

import { useQueryClient } from 'react-query'

import { useHost, useCurrentMaintenanceRun } from '@opentrons/react-api-client'

import { useNotifyService } from '../useNotifyService'

import type { UseQueryResult } from 'react-query'
import type { MaintenanceRun } from '@opentrons/api-client'
import type { QueryOptionsWithPolling } from '../useNotifyService'

export function useNotifyCurrentMaintenanceRun(
  options: QueryOptionsWithPolling<MaintenanceRun, Error>
): UseQueryResult<MaintenanceRun> | UseQueryResult<MaintenanceRun, Error> {
  const host = useHost()
  const queryClient = useQueryClient()
  const [refetchUsingHTTP, setRefetchUsingHTTP] = React.useState(true)
  const queryKey = [host, 'maintenance_runs', 'current_run']

  const {
    notifyQueryResponse,
    isNotifyError,
  } = useNotifyService<MaintenanceRun>({
    topic: 'robot-server/maintenance_runs',
    queryKey: queryKey,
    refetchUsingHTTP: () => setRefetchUsingHTTP(true),
    options: {
      ...options,
      enabled: host !== null && options.enabled !== false,
      onError: () => queryClient.resetQueries(queryKey),
    },
  })

  const isNotifyEnabled = !isNotifyError && !options.forceHttpPolling
  if (!isNotifyEnabled && !refetchUsingHTTP) setRefetchUsingHTTP(true)
  const isHTTPEnabled =
    host !== null && options.enabled !== false && refetchUsingHTTP

  const httpQueryResult = useCurrentMaintenanceRun({
    ...options,
    enabled: isHTTPEnabled,
    onSettled: isNotifyEnabled ? () => setRefetchUsingHTTP(false) : undefined,
  })

  return isHTTPEnabled ? httpQueryResult : notifyQueryResponse
}
