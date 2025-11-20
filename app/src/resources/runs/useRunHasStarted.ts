import { RUN_STATUS_IDLE } from '@opentrons/api-client'

import { useNotifyRunQuery } from './useNotifyRunQuery'

export function useRunHasStarted(runId: string | null): boolean {
  const { data: runRecord } = useNotifyRunQuery(runId)
  const runStatus = runRecord?.data.status ?? null
  return runStatus != null && runStatus !== RUN_STATUS_IDLE
}
