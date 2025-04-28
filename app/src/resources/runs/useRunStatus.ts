import {
  RUN_ACTION_TYPE_PLAY,
  RUN_STATUS_IDLE,
  RUN_STATUS_RUNNING,
} from '@opentrons/api-client'
import type { Run, RunAction, RunStatus } from '@opentrons/api-client'
import type { UseQueryOptions } from 'react-query'
import { DEFAULT_STATUS_REFETCH_INTERVAL } from './constants'
import { useNotifyRunQuery } from './useNotifyRunQuery'

export function useRunStatus(
  runId: string | null,
  options?: UseQueryOptions<Run>
): RunStatus | null {
  const { data } = useNotifyRunQuery(runId ?? null, {
    refetchInterval: DEFAULT_STATUS_REFETCH_INTERVAL,
    ...options,
  })

  const runStatus = data?.data?.status as RunStatus

  const actions = data?.data?.actions as RunAction[]
  const firstPlay = actions?.find(
    action => action.actionType === RUN_ACTION_TYPE_PLAY
  )
  const runStartTime = firstPlay?.createdAt

  // display an idle status as 'running' in the UI after a run has started.
  // todo(mm, 2024-06-24): This may not be necessary anymore. It looks like it was
  // working around prior (?) server behavior where a run's status would briefly flicker
  // to idle in between commands.
  const adjustedRunStatus: RunStatus | null =
    runStatus === RUN_STATUS_IDLE && runStartTime != null
      ? RUN_STATUS_RUNNING
      : runStatus

  return adjustedRunStatus
}
