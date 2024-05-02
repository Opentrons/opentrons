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
  const [refetch, setRefetch] = React.useState<HTTPRefetchFrequency>(null)

  useNotifyService<MaintenanceRun, Error>({
    topic: 'robot-server/maintenance_runs/current_run',
    setRefetch,
    options,
  })

  const httpQueryResult = useCurrentMaintenanceRun({
    ...options,
    enabled: options?.enabled !== false && refetch != null,
    onSettled: refetch === 'once' ? () => setRefetch(null) : () => null,
  })

  return httpQueryResult
}
