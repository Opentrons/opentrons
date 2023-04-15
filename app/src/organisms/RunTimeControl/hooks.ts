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
import { useRunQuery, useRunActionMutations } from '@opentrons/react-api-client'

import {
  useCloneRun,
  useCurrentRunId,
  useRunCommands,
} from '../ProtocolUpload/hooks'
import { UseQueryOptions } from 'react-query'
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

/**
 * React hook that provides controls for interacting with a run.
 * @param {string | null} runId - The id of the run to interact with.
 * @param {(createRunResponse: Run) => unknown} [onCloneRunSuccess] - Callback function that will be called after a successful cloneRun.
 * @returns {RunControls} - An object containing functions for playing, pausing, stopping, resetting the run, as well as boolean flags indicating loading states for the different actions.
 */
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

/**
 * Returns the current status of the run with the specified ID.
 *
 * @param {string|null} runId - The ID of the run.
 * @param {Object} [options] - Optional options for the `useQuery` hook.
 * @param {number} [options.refetchInterval=15000] - The interval at which the query will be automatically re-fetched.
 * @returns {string|null} - The current status of the run.
 */
export function useRunStatus(
  runId: string | null,
  options?: UseQueryOptions<Run>
): RunStatus | null {
  const lastRunStatus = React.useRef<RunStatus | null>(null)

  const { data } = useRunQuery(runId ?? null, {
    refetchInterval: DEFAULT_STATUS_REFETCH_INTERVAL,
    enabled:
      lastRunStatus.current == null ||
      !([
        RUN_STATUS_STOP_REQUESTED,
        RUN_STATUS_FAILED,
        RUN_STATUS_SUCCEEDED,
      ] as RunStatus[]).includes(lastRunStatus.current),
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

/**
 * Returns the current status of the current run.
 *
 * @param {Object} [options] - Optional options for the `useQuery` hook.
 * @param {number} [options.refetchInterval=15000] - The interval at which the query will be automatically refetched.
 * @returns {string|null} - The current status of the current run.
 */
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

/**
 * Hook that returns timestamps for a given run, including when it started, paused, stopped, and completed.
 * @param {string | null} runId - The ID of the run to get timestamps for.
 * @returns {RunTimestamps} An object containing timestamps for the run.
 */
export function useRunTimestamps(runId: string | null): RunTimestamps {
  const runStatus = useRunStatus(runId)
  const { actions = [], errors = [] } =
    useRunQuery(runId, {
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

/**
 * Hook that returns any errors associated with a given run.
 * @param {string | null} runId - The ID of the run to get errors for.
 * @returns {RunData['errors']} An array of errors associated with the run.
 */
export function useRunErrors(runId: string | null): RunData['errors'] {
  const { data: runRecord } = useRunQuery(runId, {
    refetchInterval: DEFAULT_RUN_QUERY_REFETCH_INTERVAL,
  })

  return runRecord?.data?.errors ?? []
}
