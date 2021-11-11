import last from 'lodash/last'

import {
  RUN_ACTION_TYPE_PLAY,
  RUN_ACTION_TYPE_PAUSE,
  RunAction,
  RunStatus,
} from '@opentrons/api-client'
import { useRunQuery, useRunActionMutations } from '@opentrons/react-api-client'

import { useCloneRun } from '../ProtocolUpload/hooks/useCloneRun'
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

  const { data } = useRunQuery(currentRunId)

  const currentState = data?.data.status as RunStatus

  return currentState
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
