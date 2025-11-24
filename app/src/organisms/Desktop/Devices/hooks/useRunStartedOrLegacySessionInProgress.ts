import { RUN_STATUS_IDLE } from '@opentrons/api-client'
import { useAllSessionsQuery } from '@opentrons/react-api-client'

import {
  DEFAULT_STATUS_REFETCH_INTERVAL,
  useCurrentRunId,
  useNotifyRunQuery,
} from '/app/resources/runs'

export function useRunStartedOrLegacySessionInProgress(): boolean {
  const runId = useCurrentRunId()
  const { data: runRecord } = useNotifyRunQuery(runId, {
    refetchInterval: DEFAULT_STATUS_REFETCH_INTERVAL,
  })
  const runStatus = runRecord?.data.status ?? null
  const allSessionsQueryResponse = useAllSessionsQuery()

  return (
    (runStatus != null && runStatus !== RUN_STATUS_IDLE) ||
    (allSessionsQueryResponse?.data?.data != null &&
      allSessionsQueryResponse?.data?.data?.length !== 0)
  )
}
