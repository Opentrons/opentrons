import {
  RUN_ACTION_TYPE_PLAY,
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_FAILED,
  RUN_STATUS_IDLE,
  RUN_STATUS_STOPPED,
  RUN_STATUS_SUCCEEDED,
} from '@opentrons/api-client'

import { useNotifyRunQuery } from '../../../resources/runs'
import { CURRENT_RUN_POLL } from '../constants'

export function useCurrentRunRoute(currentRunId: string): string | null {
  const { data: runRecord, isFetching } = useNotifyRunQuery(currentRunId, {
    refetchInterval: CURRENT_RUN_POLL,
  })

  const runStatus = runRecord?.data.status
  const runActions = runRecord?.data.actions
  if (
    runRecord == null ||
    runStatus == null ||
    runActions == null ||
    isFetching
  ) {
    return null
  }
  // grabbing run id off of the run query to have all routing info come from one source of truth
  const runId = runRecord.data.id
  const hasRunStarted = runActions?.some(
    action => action.actionType === RUN_ACTION_TYPE_PLAY
  )
  if (
    runStatus === RUN_STATUS_SUCCEEDED ||
    (runStatus === RUN_STATUS_STOPPED && hasRunStarted) ||
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
    // includes runs cancelled before starting and runs not yet started
    return null
  }
}
