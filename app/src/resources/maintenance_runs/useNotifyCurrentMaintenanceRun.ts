import { useCurrentMaintenanceRun } from '@opentrons/react-api-client'

import { useNotifyService } from '../useNotifyService'

import type { UseQueryResult } from 'react-query'
import type { MaintenanceRun } from '@opentrons/api-client'
import type { QueryOptionsWithPolling } from '../useNotifyService'

export function useNotifyCurrentMaintenanceRun(
  options: QueryOptionsWithPolling<MaintenanceRun, Error> = {}
): UseQueryResult<MaintenanceRun> | UseQueryResult<MaintenanceRun, Error> {
  const { notifyOnSettled, shouldRefetch } = useNotifyService({
    topic: 'robot-server/maintenance_runs/current_run',
    options,
  })

  const httpQueryResult = useCurrentMaintenanceRun({
    ...options,
    enabled: options?.enabled !== false && shouldRefetch,
    onSettled: notifyOnSettled,
  })

  return httpQueryResult
}
