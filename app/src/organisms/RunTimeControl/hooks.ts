import last from 'lodash/last'

import {
  RUN_ACTION_TYPE_PLAY,
  RUN_ACTION_TYPE_PAUSE,
  RUN_STATUS_IDLE,
  RUN_STATUS_RUNNING,
  RUN_STATUS_STOPPED,
  RUN_STATUS_FAILED,
  RUN_STATUS_SUCCEEDED,
  RUN_ACTION_TYPE_STOP,
} from '@opentrons/api-client'
import {
  useCommandQuery,
  useRunQuery,
  useRunActionMutations,
} from '@opentrons/react-api-client'

import {
  useCloneRun,
  useCurrentRun,
  useCurrentRunId,
  useCurrentRunCommands,
} from '../ProtocolUpload/hooks'
import { QueryOptions } from '@testing-library/react'
import type { RunAction, RunStatus } from '@opentrons/api-client'

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
export function useRunStatus(options?: QueryOptions): RunStatus | null {
  const currentRunId = useCurrentRunId()

  const { data } = useRunQuery(currentRunId ?? null, {
    refetchInterval: DEFAULT_STATUS_REFETCH_INTERVAL,
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

// TODO: IMMEDIATELY replace with actual run timestamps from server,
// and remove command detail request once summary includes timestamps,
// consider refactoring these timestamp hooks into one useRunTimestamps hook
export function useRunCompleteTime(): string | null {
  const runStatus = useRunStatus()
  const { actions = [], errors = [], id: runId = null } =
    useCurrentRun()?.data ?? {}
  const runCommands = useCurrentRunCommands() ?? []

  const lastCommandId = last(runCommands)?.id
  const { data: commandData } = useCommandQuery(runId, lastCommandId ?? null)

  const lastActionAt = last(actions)?.createdAt
  const lastErrorAt = last(errors)?.createdAt
  const lastCommandAt = commandData?.data?.completedAt

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
