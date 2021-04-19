export interface RepeatCallOptions {
  handler: () => unknown
  interval: number | number[]
  callImmediately?: boolean
}

export interface RepeatCallResult {
  cancel: () => void
}

export function repeatCall(options: RepeatCallOptions): RepeatCallResult {
  const { handler, interval, callImmediately = false } = options

  const intervalQueue =
    typeof interval === 'number' ? [interval] : [...interval]

  let timeoutId: NodeJS.Timeout | null = null

  const getNextInterval = (): number =>
    intervalQueue.length > 1
      ? (intervalQueue.shift() as number)
      : intervalQueue[0]

  const setNextTimeout = (): void => {
    const timeout = getNextInterval()

    timeoutId = setTimeout(() => {
      handler()
      setNextTimeout()
    }, timeout)
  }

  const cancel = (): void => {
    if (timeoutId !== null) {
      clearInterval(timeoutId)
    }
  }

  if (callImmediately) {
    handler()
  }

  setNextTimeout()

  return { cancel }
}
