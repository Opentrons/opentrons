import * as React from 'react'

import { useCurrentMaintenanceRun } from '@opentrons/react-api-client'

import { useNotifyService } from '../useNotifyService'

import type { UseQueryResult } from 'react-query'
import type { MaintenanceRun } from '@opentrons/api-client'
import type {
  QueryOptionsWithPolling,
  HTTPRefetchFrequency,
} from '../useNotifyService'

export function useNotifyCurrentMaintenanceRun(
  options: QueryOptionsWithPolling<MaintenanceRun, Error> = {}
): UseQueryResult<MaintenanceRun> | UseQueryResult<MaintenanceRun, Error> {
  const [
    refetchUsingHTTP,
    setRefetchUsingHTTP,
  ] = React.useState<HTTPRefetchFrequency>(null)

  useNotifyService<MaintenanceRun, Error>({
    topic: 'robot-server/maintenance_runs/current_run',
    setRefetchUsingHTTP,
    options,
  })

  const httpQueryResult = useCurrentMaintenanceRun({
    ...options,
    enabled: options?.enabled !== false && refetchUsingHTTP != null,
    onSettled:
      refetchUsingHTTP === 'once'
        ? () => setRefetchUsingHTTP(null)
        : () => null,
  })

  return httpQueryResult
}
