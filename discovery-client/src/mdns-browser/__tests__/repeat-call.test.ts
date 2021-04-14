// call a function on an interval with variable time
import { repeatCall } from '../repeat-call'

describe('repeat call', () => {
  const handler = jest.fn()

  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  it('should call a handler on a given interval', () => {
    repeatCall({ handler, interval: 100 })

    jest.advanceTimersByTime(101)
    expect(handler).toHaveBeenCalledTimes(1)

    jest.advanceTimersByTime(100)
    expect(handler).toHaveBeenCalledTimes(2)

    jest.advanceTimersByTime(100)
    expect(handler).toHaveBeenCalledTimes(3)
  })

  it('should allow the interval to be cancelled', () => {
    const { cancel } = repeatCall({ handler, interval: 100 })

    jest.advanceTimersByTime(101)
    expect(handler).toHaveBeenCalledTimes(1)
    cancel()

    jest.advanceTimersByTime(100)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should allow the handler to be called immediately', () => {
    repeatCall({ handler, interval: 100, callImmediately: true })

    expect(handler).toHaveBeenCalledTimes(1)

    jest.advanceTimersByTime(101)
    expect(handler).toHaveBeenCalledTimes(2)
  })

  it('should allow an interval range to be called immediately', () => {
    repeatCall({ handler, interval: [100, 200, 300] })

    jest.advanceTimersByTime(101)
    expect(handler).toHaveBeenCalledTimes(1)

    jest.advanceTimersByTime(200)
    expect(handler).toHaveBeenCalledTimes(2)

    jest.advanceTimersByTime(300)
    expect(handler).toHaveBeenCalledTimes(3)

    // latch in last value
    jest.advanceTimersByTime(300)
    expect(handler).toHaveBeenCalledTimes(4)
  })
})
