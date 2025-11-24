import { RUN_STATUS_IDLE } from '@opentrons/api-client'

import {
  DEFAULT_STATUS_REFETCH_INTERVAL,
  useNotifyRunQuery,
} from '/app/resources/runs'

export function useRunHasStarted(runId: string | null): boolean {
  const { data: runRecord } = useNotifyRunQuery(runId, {
    refetchInterval: DEFAULT_STATUS_REFETCH_INTERVAL,
  })
  const runStatus = runRecord?.data.status ?? null
  return runStatus != null && runStatus !== RUN_STATUS_IDLE
}
