import { useEffect } from 'react'

import { useCurrentMaintenanceRun } from '@opentrons/react-api-client'

import { useNotifyDataReady } from '../../useNotifyDataReady'

import type { UseQueryResult } from 'react-query'
import type { MaintenanceRun } from '@opentrons/api-client'
import type { QueryOptionsWithPolling } from '../../useNotifyDataReady'

export function useNotifyCurrentMaintenanceRun(
  options: QueryOptionsWithPolling<MaintenanceRun, Error> = {}
): UseQueryResult<MaintenanceRun> | UseQueryResult<MaintenanceRun, Error> {
  const { refetch, queryOptionsNotify } = useNotifyDataReady({
    topic: 'robot-server/maintenance_runs/current_run',
    options,
  })

  const httpQueryResult = useCurrentMaintenanceRun(queryOptionsNotify)

  useEffect(() => {
    if (refetch > 0) {
      void httpQueryResult.refetch()
    }

    // httpQueryResult.refetch is stable, the result object is not
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetch])

  return httpQueryResult
}
