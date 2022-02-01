import last from 'lodash/last'
import * as React from 'react'

import {
  RUN_ACTION_TYPE_PLAY,
  RUN_ACTION_TYPE_PAUSE,
  RUN_STATUS_IDLE,
  RUN_STATUS_RUNNING,
  RUN_STATUS_STOPPED,
  RUN_STATUS_FAILED,
  RUN_STATUS_SUCCEEDED,
  RUN_ACTION_TYPE_STOP,
  RUN_STATUS_STOP_REQUESTED,
} from '@opentrons/api-client'
import { useRunQuery, useRunActionMutations } from '@opentrons/react-api-client'

import {
  useCloneRun,
  useCurrentRun,
  useCurrentRunId,
  useCurrentRunCommands,
} from '../ProtocolUpload/hooks'
import { UseQueryOptions } from 'react-query'
import type { RunAction, RunStatus, Run } from '@opentrons/api-client'

interface RunControls {
  play: () => void
  pause: () => void
  stop: () => void
  reset: () => void
  isPlayRunActionLoading: boolean
  isPauseRunActionLoading: boolean
  isStopRunActionLoading: boolean
  isResetRunLoading: boolean
}

export function useRunControls(): RunControls {
  const currentRunId = useCurrentRunId()

  const {
    playRun,
    pauseRun,
    stopRun,
    isPlayRunActionLoading,
    isPauseRunActionLoading,
    isStopRunActionLoading,
  } = useRunActionMutations(currentRunId as string)

  const { cloneRun, isLoading: isResetRunLoading } = useCloneRun(
    currentRunId ?? null
  )

  return {
    play: playRun,
    pause: pauseRun,
    stop: stopRun,
    reset: cloneRun,
    isPlayRunActionLoading,
    isPauseRunActionLoading,
    isStopRunActionLoading,
    isResetRunLoading,
  }
}

const DEFAULT_STATUS_REFETCH_INTERVAL = 10000 // 10 seconds
// TODO: remove refetch interval, and pass through optional options param,
// get runStartTime from top level timestamp
export function useRunStatus(options?: UseQueryOptions<Run>): RunStatus | null {
  const currentRunId = useCurrentRunId()
  const lastRunStatus = React.useRef<RunStatus | null>(null)

  const { data } = useRunQuery(currentRunId ?? null, {
    refetchInterval: DEFAULT_STATUS_REFETCH_INTERVAL,
    enabled: ![
      RUN_STATUS_STOP_REQUESTED,
      RUN_STATUS_FAILED,
      RUN_STATUS_SUCCEEDED,
    ].includes(lastRunStatus.current),
    onSuccess: data => (lastRunStatus.current = data?.data?.status ?? null),
    ...options,
  })

  const runStatus = data?.data?.status as RunStatus

  const actions = data?.data?.actions as RunAction[]
  const firstPlay = actions?.find(
    action => action.actionType === RUN_ACTION_TYPE_PLAY
  )
  const runStartTime = firstPlay?.createdAt

  // display an idle status as 'running' in the UI after a run has started
  const adjustedRunStatus: RunStatus | null =
    runStatus === RUN_STATUS_IDLE && runStartTime != null
      ? RUN_STATUS_RUNNING
      : runStatus

  return adjustedRunStatus
}

export function useRunStartTime(): string | null {
  const actions = useCurrentRun()?.data?.actions ?? []
  const firstPlay = actions.find(
    action => action.actionType === RUN_ACTION_TYPE_PLAY
  )
  const runStartTime = firstPlay?.createdAt

  return runStartTime ?? null
}

export function useRunPauseTime(): string | null {
  const actions = useCurrentRun()?.data?.actions ?? []
  const lastAction = last(actions)

  return lastAction?.actionType === RUN_ACTION_TYPE_PAUSE
    ? lastAction.createdAt
    : null
}

export function useRunStopTime(): string | null {
  const actions = useCurrentRun()?.data?.actions ?? []
  const lastAction = last(actions)

  return lastAction?.actionType === RUN_ACTION_TYPE_STOP
    ? lastAction.createdAt
    : null
}

export function useRunCompleteTime(): string | null {
  const runStatus = useRunStatus()
  const { actions = [], errors = [], id: runId = null } =
    useCurrentRun()?.data ?? {}
  const runCommands =
    useCurrentRunCommands(undefined, {
      enabled: runStatus === RUN_STATUS_RUNNING,
    }) ?? []

  const lastCommand = last(runCommands)
  const lastActionAt = last(actions)?.createdAt
  const lastErrorAt = last(errors)?.createdAt
  const lastCommandAt = lastCommand?.completedAt

  let runCompletedTime = null

  if (runStatus === RUN_STATUS_STOPPED) {
    runCompletedTime = lastActionAt ?? null
  }

  if (runStatus === RUN_STATUS_FAILED) {
    runCompletedTime = lastErrorAt ?? null
  }

  if (runStatus === RUN_STATUS_SUCCEEDED) {
    runCompletedTime = lastCommandAt ?? null
  }

  return runCompletedTime
}

interface RunTimestamps {
  startedAt: string | null
  pausedAt: string | null
  stoppedAt: string | null
  completedAt: string | null
}
export function useRunTimestamps(): RunTimestamps {
  const runStatus = useRunStatus()
  const { actions = [], errors = [], id: runId = null } =
    useCurrentRun()?.data ?? {}
  const runCommands =
    useCurrentRunCommands(undefined, {
      enabled: runStatus === RUN_STATUS_RUNNING,
    }) ?? []

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
