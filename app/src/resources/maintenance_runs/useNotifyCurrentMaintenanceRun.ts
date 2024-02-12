import * as React from 'react'

import { useHost, useCurrentMaintenanceRun } from '@opentrons/react-api-client'

import { useNotifyService } from '../useNotifyService'

import type { UseQueryResult } from 'react-query'
import type { MaintenanceRun } from '@opentrons/api-client'
import type { QueryOptionsWithPolling } from '../useNotifyService'

export function useNotifyCurrentMaintenanceRun(
  options?: QueryOptionsWithPolling<MaintenanceRun, Error>
): UseQueryResult<MaintenanceRun> | UseQueryResult<MaintenanceRun, Error> {
  const host = useHost()
  const [refetchUsingHTTP, setRefetchUsingHTTP] = React.useState(false)

  const { isNotifyError } = useNotifyService<MaintenanceRun, Error>({
    topic: 'robot-server/maintenance_runs/current_run',
    refetchUsingHTTP: () => setRefetchUsingHTTP(true),
    options: {
      ...options,
      enabled: host !== null && options?.enabled !== false,
    },
  })

  const isNotifyEnabled = !isNotifyError && !options?.forceHttpPolling
  if (!isNotifyEnabled && !refetchUsingHTTP) setRefetchUsingHTTP(true)
  const isHTTPEnabled =
    host !== null && options?.enabled !== false && refetchUsingHTTP

  const httpQueryResult = useCurrentMaintenanceRun({
    ...options,
    enabled: isHTTPEnabled,
    onSettled: isNotifyEnabled ? () => setRefetchUsingHTTP(false) : undefined,
  })

  return httpQueryResult
}
