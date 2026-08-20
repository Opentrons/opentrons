import {
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_FAILED,
  RUN_STATUS_IDLE,
  RUN_STATUS_STOPPED,
  RUN_STATUS_SUCCEEDED,
} from '@opentrons/api-client'

import { useNotifyRunQuery } from '/app/resources/runs'

import { CURRENT_RUN_POLL } from '../constants'

// Returns the route to which React Router should navigate, if any.
export function useCurrentRunRoute(currentRunId: string): string | null {
  const { data: runRecord, isFetching } = useNotifyRunQuery(currentRunId, {
    refetchInterval: CURRENT_RUN_POLL,
  })

  // grabbing run id off of the run query to have all routing info come from one source of truth
  const runId = runRecord?.data.id
  const hasRunStarted = runRecord?.data.startedAt != null
  const runStatus = runRecord?.data.status

  if (isFetching || runRecord?.data.id !== currentRunId) {
    return null
  } else if (
    runStatus === RUN_STATUS_SUCCEEDED ||
    runStatus === RUN_STATUS_STOPPED ||
    runStatus === RUN_STATUS_FAILED
  ) {
    return `/runs/${runId}/summary`
  } else if (
    runStatus === RUN_STATUS_IDLE ||
    (!hasRunStarted && runStatus === RUN_STATUS_BLOCKED_BY_OPEN_DOOR)
  ) {
    return `/runs/${runId}/setup`
  } else if (hasRunStarted) {
    return `/runs/${runId}/run`
  } else {
    console.error(`Unexpected run route found for run ${runId}`, runStatus)
    return null
  }
}
