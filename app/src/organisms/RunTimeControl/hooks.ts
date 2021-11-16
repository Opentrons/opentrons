import * as React from 'react'
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
import { useInterval } from '@opentrons/components'

import { useCloneRun } from '../ProtocolUpload/hooks/useCloneRun'
import { useCurrentProtocolRun } from '../ProtocolUpload/hooks/useCurrentProtocolRun'
import { useCurrentRunId } from '../ProtocolUpload/hooks/useCurrentRunId'

interface RunControls {
  usePlay: () => void
  usePause: () => void
  useReset: () => void
}

export function useRunControls(): RunControls {
  const currentRunId = useCurrentRunId()

  const { playRun, pauseRun } = useRunActionMutations(currentRunId as string)

  const cloneRun = useCloneRun(currentRunId as string)

  const usePlay = (): void => {
    playRun()
  }
  const usePause = (): void => {
    pauseRun()
  }
  const useReset = (): void => {
    cloneRun()
  }
  return { usePlay, usePause, useReset }
}

export function useRunStatus(): RunStatus | null {
  const currentRunId = useCurrentRunId()

  const { data } = useRunQuery(currentRunId, { refetchInterval: 1000 })

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
  const currentRunId = useCurrentRunId()

  const { data } = useRunQuery(currentRunId)

  const actions = data?.data?.actions as RunAction[]
  const firstPlay = actions?.find(
    action => action.actionType === RUN_ACTION_TYPE_PLAY
  )
  const runStartTime = firstPlay?.createdAt

  return runStartTime
}

export function useRunPauseTime(): string | undefined {
  const currentRunId = useCurrentRunId()

  const { data } = useRunQuery(currentRunId)

  const actions = data?.data.actions as RunAction[]
  const pauseActions = actions?.filter(
    action => action.actionType === RUN_ACTION_TYPE_PAUSE
  )
  const lastPause = last(pauseActions)
  const pausedAt = lastPause?.createdAt

  return pausedAt
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

export function useNow() {
  const initialNow = Date()
  const [now, setNow] = React.useState(initialNow)
  useInterval(() => setNow(Date()), 500, true)
  return now
}
