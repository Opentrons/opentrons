import last from 'lodash/last'

import {
  RUN_ACTION_TYPE_PLAY,
  RUN_ACTION_TYPE_PAUSE,
  RunAction,
  RunData,
  RunStatus,
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
  reset: () => void
}

export function useRunControls(): RunControls {
  const { runRecord } = useCurrentProtocolRun()

  const currentRunId = runRecord?.data?.id

  const { playRun, pauseRun } = useRunActionMutations(currentRunId as string)

  const cloneRun = useCloneRun(currentRunId as string)

  const play = (): void => {
    playRun()
  }
  const pause = (): void => {
    pauseRun()
  }
  const reset = (): void => {
    cloneRun()
  }
  return { play, pause, reset }
}

export function useRunStatus(): RunStatus | null {
  const { runRecord } = useCurrentProtocolRun()

  const currentRunId = runRecord?.data?.id

  const { data } = useRunQuery(currentRunId as string, {
    refetchInterval: 1000,
  })

  const runStatus = data?.data.status as RunStatus

  return runStatus
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

export function useRunCompleteTime(): string | undefined {
  const { runRecord } = useCurrentProtocolRun()

  const runData = runRecord?.data as RunData
  const commands = runData?.commands
  const runId = runData?.id
  const status = runData?.status
  const lastCommand = last(commands)
  const lastCommandId = lastCommand?.id

  const { data } = useCommandQuery(runId, lastCommandId as string)

  if (
    status !== RUN_STATUS_STOPPED &&
    status !== RUN_STATUS_FAILED &&
    status !== RUN_STATUS_SUCCEEDED
  ) {
    return
  }

  const fullLastCommand = data?.data
  const runCompletedTime = fullLastCommand?.createdAt

  return runCompletedTime
}
