import last from 'lodash/last'
import {
  RUN_ACTION_TYPE_PLAY,
  RUN_ACTION_TYPE_PAUSE,
  RUN_STATUS_STOPPED,
  RUN_STATUS_FAILED,
  RUN_STATUS_FINISHING,
  RUN_STATUS_SUCCEEDED,
  RUN_ACTION_TYPE_STOP,
  RUN_STATUS_STOP_REQUESTED,
} from '@opentrons/api-client'
import { DEFAULT_RUN_QUERY_REFETCH_INTERVAL } from './constants'
import { useRunCommands } from './useRunCommands'
import { useNotifyRunQuery } from './useNotifyRunQuery'
import { useRunStatus } from './useRunStatus'

export interface RunTimestamps {
  startedAt: string | null
  pausedAt: string | null
  stoppedAt: string | null
  completedAt: string | null
}

export function useRunTimestamps(runId: string | null): RunTimestamps {
  const runStatus = useRunStatus(runId)
  const { actions = [], errors = [] } =
    useNotifyRunQuery(runId, {
      refetchInterval: DEFAULT_RUN_QUERY_REFETCH_INTERVAL,
    })?.data?.data ?? {}
  const runCommands =
    useRunCommands(
      runId,
      { cursor: null, pageLength: 1 },
      {
        enabled:
          runStatus === RUN_STATUS_SUCCEEDED ||
          runStatus === RUN_STATUS_STOPPED ||
          runStatus === RUN_STATUS_FAILED ||
          runStatus === RUN_STATUS_STOP_REQUESTED ||
          runStatus === RUN_STATUS_FINISHING,
        refetchInterval: false,
      }
    ) ?? []

  const firstPlay = actions.find(
    action => action.actionType === RUN_ACTION_TYPE_PLAY
  )
  const lastAction = last(actions)

  const lastCommand = last(runCommands)
  const lastActionAt = lastAction?.createdAt ?? null
  const lastErrorAt = last(errors)?.createdAt
  const lastCommandAt = lastCommand?.completedAt

  const startedAt = firstPlay?.createdAt ?? null
  const pausedAt =
    lastAction?.actionType === RUN_ACTION_TYPE_PAUSE ? lastActionAt : null
  const stoppedAt =
    lastAction?.actionType === RUN_ACTION_TYPE_STOP ? lastActionAt : null
  let completedAt = null
  switch (runStatus) {
    case RUN_STATUS_STOPPED:
      completedAt = lastActionAt ?? null
      break
    case RUN_STATUS_FAILED:
      completedAt = lastErrorAt ?? null
      break
    case RUN_STATUS_SUCCEEDED:
      completedAt = lastCommandAt ?? null
      break
  }

  return {
    startedAt,
    pausedAt,
    stoppedAt,
    completedAt,
  }
}
