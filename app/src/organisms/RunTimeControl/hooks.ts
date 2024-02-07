import last from 'lodash/last'
import * as React from 'react'

import {
  RUN_ACTION_TYPE_PLAY,
  RUN_ACTION_TYPE_PAUSE,
  RUN_STATUS_IDLE,
  RUN_STATUS_RUNNING,
  RUN_STATUS_STOPPED,
  RUN_STATUS_FAILED,
  RUN_STATUS_FINISHING,
  RUN_STATUS_SUCCEEDED,
  RUN_ACTION_TYPE_STOP,
  RUN_STATUS_STOP_REQUESTED,
} from '@opentrons/api-client'
import { useRunActionMutations } from '@opentrons/react-api-client'

import {
  useCloneRun,
  useCurrentRunId,
  useRunCommands,
} from '../ProtocolUpload/hooks'
import { useNotifyRunQuery } from '../../resources/runs/useNotifyRunQuery'

import type { UseQueryOptions } from 'react-query'
import type { RunAction, RunStatus, Run, RunData } from '@opentrons/api-client'

export interface RunControls {
  play: () => void
  pause: () => void
  stop: () => void
  reset: () => void
  isPlayRunActionLoading: boolean
  isPauseRunActionLoading: boolean
  isStopRunActionLoading: boolean
  isResetRunLoading: boolean
}

export function useRunControls(
  runId: string | null,
  onCloneRunSuccess?: (createRunResponse: Run) => unknown
): RunControls {
  const {
    playRun,
    pauseRun,
    stopRun,
    isPlayRunActionLoading,
    isPauseRunActionLoading,
    isStopRunActionLoading,
  } = useRunActionMutations(runId as string)

  const { cloneRun, isLoading: isResetRunLoading } = useCloneRun(
    runId ?? null,
    onCloneRunSuccess
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
export function useRunStatus(
  runId: string | null,
  options?: UseQueryOptions<Run>
): RunStatus | null {
  const lastRunStatus = React.useRef<RunStatus | null>(null)

  const { data } = useNotifyRunQuery(runId ?? null, {
    refetchInterval: DEFAULT_STATUS_REFETCH_INTERVAL,
    enabled:
      lastRunStatus.current == null ||
      !([RUN_STATUS_FAILED, RUN_STATUS_SUCCEEDED] as RunStatus[]).includes(
        lastRunStatus.current
      ),
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

export function useCurrentRunStatus(
  options?: UseQueryOptions<Run>
): RunStatus | null {
  const currentRunId = useCurrentRunId()

  return useRunStatus(currentRunId, options)
}

export interface RunTimestamps {
  startedAt: string | null
  pausedAt: string | null
  stoppedAt: string | null
  completedAt: string | null
}

const DEFAULT_RUN_QUERY_REFETCH_INTERVAL = 5000
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

export function useRunErrors(runId: string | null): RunData['errors'] {
  const { data: runRecord } = useNotifyRunQuery(runId, {
    refetchInterval: DEFAULT_RUN_QUERY_REFETCH_INTERVAL,
  })

  return runRecord?.data?.errors ?? []
}
