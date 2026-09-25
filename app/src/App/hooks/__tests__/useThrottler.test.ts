import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useThrottler } from '../useThrottler'

describe('useThrottler', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.resetAllMocks()
  })

  it('does not call the function again until the interval has passed', () => {
    const throttleMS = 1000
    const { result } = renderHook(() => useThrottler(throttleMS))
    const toCall = vi.fn()

    act(() => {
      result.current.maybeCall(toCall)
      result.current.maybeCall(toCall)
      result.current.maybeCall(toCall)
    })
    expect(toCall).toHaveBeenCalledTimes(1)

    act(() => {
      vi.advanceTimersByTime(throttleMS + 1)
      result.current.maybeCall(toCall)
      result.current.maybeCall(toCall)
      result.current.maybeCall(toCall)
    })
    expect(toCall).toHaveBeenCalledTimes(2)

    act(() => {
      vi.advanceTimersByTime(throttleMS + 1)
      result.current.maybeCall(toCall)
      result.current.maybeCall(toCall)
      result.current.maybeCall(toCall)
    })
    expect(toCall).toHaveBeenCalledTimes(3)
  })

  it('uses the updated interval after rerender', () => {
    const { rerender, result } = renderHook(
      ({ throttleMS }) => useThrottler(throttleMS),
      { initialProps: { throttleMS: 1000 } }
    )
    const toCall = vi.fn()

    act(() => {
      result.current.maybeCall(toCall)
      result.current.maybeCall(toCall)
      result.current.maybeCall(toCall)
    })
    expect(toCall).toHaveBeenCalledTimes(1)

    act(() => {
      vi.advanceTimersByTime(500)
      result.current.maybeCall(toCall)
      result.current.maybeCall(toCall)
      result.current.maybeCall(toCall)
    })
    expect(toCall).toHaveBeenCalledTimes(1)

    act(() => {
      rerender({ throttleMS: 100 })
    })
    act(() => {
      result.current.maybeCall(toCall)
      result.current.maybeCall(toCall)
      result.current.maybeCall(toCall)
    })
    expect(toCall).toHaveBeenCalledTimes(2)

    act(() => {
      vi.advanceTimersByTime(101)
      result.current.maybeCall(toCall)
      result.current.maybeCall(toCall)
      result.current.maybeCall(toCall)
    })
    expect(toCall).toHaveBeenCalledTimes(3)
  })

  it('keeps the same maybeCall reference when throttleMS is unchanged', () => {
    const throttleMS = 1000
    const { rerender, result } = renderHook(
      ({ throttleMS }) => useThrottler(throttleMS),
      { initialProps: { throttleMS } }
    )

    const initialMaybeCall = result.current.maybeCall
    rerender({ throttleMS })
    expect(result.current.maybeCall).toBe(initialMaybeCall)
  })
})
