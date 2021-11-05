import { RunAction, RunStatus } from '@opentrons/api-client'
import { useRunQuery, useRunActionMutations } from '@opentrons/react-api-client'

import { useCurrentProtocolRun } from '../ProtocolUpload/useCurrentProtocolRun'

interface RunControls {
  usePlay: () => void
  usePause: () => void
  useReset: () => void
}

export function useRunControls(): RunControls {
  const { runRecord } = useCurrentProtocolRun()
  // hardcoded run created in postman
  const { playRun, pauseRun } = useRunActionMutations(
    '49247bbd-4bac-4178-887b-4f7a6fb916b3'
  )
  // const { playRun, pauseRun } = useRunActionMutations(
  //   runRecord?.data.id as string
  // )

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

export function useRunStatus(): RunStatus {
  const { runRecord } = useCurrentProtocolRun()

  // const { data } = useRunQuery(runRecord?.data.id as string)
  const { data } = useRunQuery('49247bbd-4bac-4178-887b-4f7a6fb916b3')

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
  const { runRecord } = useCurrentProtocolRun()

  // hardcoded run created in postman
  const { data } = useRunQuery('49247bbd-4bac-4178-887b-4f7a6fb916b3')
  // const { data } = useRunQuery(runRecord?.data.id as string)

  const actions = data?.data.actions as RunAction[]

  // find first play action
  const firstPlay = actions?.[0]

  const runStart = firstPlay?.createdAt
  return runStart
}
