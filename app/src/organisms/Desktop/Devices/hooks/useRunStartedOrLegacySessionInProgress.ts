import { useAllSessionsQuery } from '@opentrons/react-api-client'

import { isIdleStatus } from '/app/local-resources/runs/utils'
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
    isIdleStatus(runStatus) ||
    (allSessionsQueryResponse?.data?.data != null &&
      allSessionsQueryResponse?.data?.data?.length !== 0)
  )
}
