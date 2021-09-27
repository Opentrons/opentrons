interface RunControls {
  play: () => void
  pause: () => void
  reset: () => void
}

export function useRunControls(): RunControls {
  const play = () => {
    console.log('TODO: wire up to protocol play endpoint')
  }
  const pause = () => {
    console.log('TODO: wire up to protocol pause endpoint')
  }
  const reset = () => {
    console.log('TODO: wire up to protocol reset endpoint')
  }
  return { play, pause, reset }
}

// TODO: IMMEDIATELY replace with real status enum type from server run status
type RunStatus = 'loaded' | 'running' | 'paused' | 'finished' | 'canceled'
export function useRunStatus(): RunStatus {
  const runStatus = 'loaded'
  return runStatus
}

export function useRunDisabledReason(): string | null {
  /* TODO: IMMEDIATELY return reasons for "protocol analysis incomplete" ,
   "protocol is being canceled", "required modules not detected",
   "required pipettes not detected", "isBlocked?"
  */
  return null
}
