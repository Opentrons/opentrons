import last from 'lodash/last'

import {
  RUN_ACTION_TYPE_PLAY,
  RUN_ACTION_TYPE_PAUSE,
  RunAction,
  RunData,
  RunStatus,
  RUN_STATUS_IDLE,
  RUN_STATUS_RUNNING,
  RUN_STATUS_STOPPED,
  RUN_STATUS_FAILED,
  RUN_STATUS_SUCCEEDED,
} from '@opentrons/api-client'
import {
  useCommandQuery,
  useRunQuery,
  useRunActionMutations,
} from '@opentrons/react-api-client'

import { useCloneRun } from '../ProtocolUpload/hooks/useCloneRun'
import { useCurrentProtocolRun } from '../ProtocolUpload/hooks/useCurrentProtocolRun'

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
  const { runRecord } = useCurrentProtocolRun()

  const currentRunId = runRecord?.data?.id

  const {
    playRun,
    pauseRun,
    stopRun,
    isPlayRunActionLoading,
    isPauseRunActionLoading,
    isStopRunActionLoading,
  } = useRunActionMutations(currentRunId as string)

  const { cloneRun, isLoading: isResetRunLoading } = useCloneRun(
    currentRunId as string
  )

  const play = (): void => {
    playRun()
  }
  const pause = (): void => {
    pauseRun()
  }
  const reset = (): void => {
    cloneRun()
  }
  return {
    play,
    pause,
    stop,
    reset,
    isPlayRunActionLoading,
    isPauseRunActionLoading,
    isStopRunActionLoading,
    isResetRunLoading,
  }
}

export function useRunStatus(): RunStatus | null {
  const { runRecord } = useCurrentProtocolRun()

  const currentRunId = runRecord?.data?.id

  const { data } = useRunQuery(currentRunId as string, {
    refetchInterval: 1000,
  })

  const runStatus = data?.data.status as RunStatus

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

export function useRunDisabledReason(): string | null {
  /* TODO: IMMEDIATELY return reasons for "protocol analysis incomplete" ,
   "protocol is being canceled", "required modules not detected",
   "required pipettes not detected", "isBlocked?"
  */
  return null
}

export function useRunStartTime(): string | undefined {
  const { runRecord } = useCurrentProtocolRun()

  const currentRunId = runRecord?.data?.id

  const { data } = useRunQuery(currentRunId as string)

  const actions = data?.data?.actions as RunAction[]
  const firstPlay = actions?.find(
    action => action.actionType === RUN_ACTION_TYPE_PLAY
  )
  const runStartTime = firstPlay?.createdAt

  return runStartTime
}

export function useRunPauseTime(): string | null {
  const { runRecord } = useCurrentProtocolRun()

  const currentRunId = runRecord?.data?.id

  const { data } = useRunQuery(currentRunId as string)

  const actions = data?.data.actions as RunAction[]
  const lastAction = last(actions)

  return lastAction?.actionType === RUN_ACTION_TYPE_PAUSE
    ? lastAction.createdAt
    : null
}

export function useRunCompleteTime(): string | null {
  const { runRecord } = useCurrentProtocolRun()

  const runData = runRecord?.data as RunData
  const runId = runData?.id
  const runStatus = runData?.status

  const lastCommandId = last(runData?.commands)?.id

  const { data: commandData } = useCommandQuery(runId, lastCommandId as string)

  const lastActionAt = last(runData?.actions)?.createdAt
  const lastErrorAt = last(runData?.errors)?.createdAt
  const lastCommandAt = commandData?.data?.createdAt

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
