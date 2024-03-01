import { vi, describe, beforeEach, expect, afterEach, it } from 'vitest'
// call a function on an interval with variable time
import { repeatCall } from '../repeat-call'

describe('repeat call', () => {
  const handler = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('should call a handler on a given interval', () => {
    repeatCall({ handler, interval: 100 })

    vi.advanceTimersByTime(101)
    expect(handler).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(100)
    expect(handler).toHaveBeenCalledTimes(2)

    vi.advanceTimersByTime(100)
    expect(handler).toHaveBeenCalledTimes(3)
  })

  it('should allow the interval to be cancelled', () => {
    const { cancel } = repeatCall({ handler, interval: 100 })

    vi.advanceTimersByTime(101)
    expect(handler).toHaveBeenCalledTimes(1)
    cancel()

    vi.advanceTimersByTime(100)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should allow the handler to be called immediately', () => {
    repeatCall({ handler, interval: 100, callImmediately: true })

    expect(handler).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(101)
    expect(handler).toHaveBeenCalledTimes(2)
  })

  it('should allow an interval range to be called immediately', () => {
    repeatCall({ handler, interval: [100, 200, 300] })

    vi.advanceTimersByTime(101)
    expect(handler).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(200)
    expect(handler).toHaveBeenCalledTimes(2)

    vi.advanceTimersByTime(300)
    expect(handler).toHaveBeenCalledTimes(3)

    // latch in last value
    vi.advanceTimersByTime(300)
    expect(handler).toHaveBeenCalledTimes(4)
  })
})
