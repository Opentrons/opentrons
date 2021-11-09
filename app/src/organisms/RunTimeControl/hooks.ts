import { RunAction, RunStatus } from '@opentrons/api-client'
import {
  useAllRunsQuery,
  useRunQuery,
  useRunActionMutations,
} from '@opentrons/react-api-client'

// import { useCurrentProtocolRun } from '../ProtocolUpload/useCurrentProtocolRun'

interface RunControls {
  usePlay: () => void
  usePause: () => void
  useReset: () => void
}

export function useRunControls(): RunControls {
  // const { runRecord } = useCurrentProtocolRun()
  // const currentRunId = runRecord?.data.id

  // TODO(bh, 11-8-2021): temporarily use first run as current
  const { data: runsData } = useAllRunsQuery()
  const currentRunId = runsData?.data[0].id as string

  const { playRun, pauseRun } = useRunActionMutations(currentRunId)

  const usePlay = (): void => {
    playRun()
  }
  const usePause = (): void => {
    pauseRun()
  }
  const useReset = (): void => {
    console.log('TODO: wire up to protocol reset endpoint')
  }
  return { usePlay, usePause, useReset }
}

export function useRunStatus(): RunStatus | null {
  // const { runRecord } = useCurrentProtocolRun()
  // const currentRunId = runRecord?.data.id

  // TODO(bh, 11-8-2021): temporarily use first run as current
  const { data: runsData } = useAllRunsQuery()
  const currentRunId = runsData?.data[0].id as string

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
  // const { runRecord } = useCurrentProtocolRun()
  // const currentRunId = runRecord?.data.id

  // TODO(bh, 11-8-2021): temporarily use first run as current
  const { data: runsData } = useAllRunsQuery()
  const currentRunId = runsData?.data[0].id as string

  const { data } = useRunQuery(currentRunId)

  const actions = data?.data.actions as RunAction[]

  const firstPlay = actions?.find(action => action.actionType === 'play')

  const runStartTime = firstPlay?.createdAt
  return runStartTime
}

export function useRunPauseTime(): string | undefined {
  // const { runRecord } = useCurrentProtocolRun()
  // const currentRunId = runRecord?.data.id

  // TODO(bh, 11-8-2021): temporarily use first run as current
  const { data: runsData } = useAllRunsQuery()
  const currentRunId = runsData?.data[0].id as string

  const { data } = useRunQuery(currentRunId)

  const actions = data?.data.actions as RunAction[]

  const pauseActions = actions?.filter(action => action.actionType === 'pause')

  const lastPause = pauseActions?.[pauseActions.length - 1]

  const pausedAt = lastPause?.createdAt

  return pausedAt
}
