import { act, fireEvent, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SLEEP_NEVER_MS } from '/app/local-resources/dom-utils'

import { useScreenIdle } from '../useScreenIdle'

const MOCK_OPTIONS = {
  initialState: false,
}

describe('useIdle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initially return the default initialState', () => {
    const mockTime = 1000
    const { result } = renderHook(() => useScreenIdle(mockTime))
    expect(result.current).toBe(true)
  })

  it('should initially return the given initialState', () => {
    const mockTime = 1000
    const { result } = renderHook(() => useScreenIdle(mockTime, MOCK_OPTIONS))
    expect(result.current).toBe(false)
  })

  it('should return true after the timer elapses, then false after there is user activity again', async () => {
    const mockTime = 12345
    const { result } = renderHook(() => useScreenIdle(mockTime, MOCK_OPTIONS))

    expect(result.current).toBe(false)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(mockTime - 1)
    })
    expect(result.current).toBe(false)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(result.current).toBe(true)

    act(() => {
      fireEvent.click(document)
    })
    expect(result.current).toBe(false)
  })

  it('should return false as long as there is user activity, then true after the timer elapses', async () => {
    const mockTime = 1000
    const { result } = renderHook(() => useScreenIdle(mockTime, MOCK_OPTIONS))

    act(() => {
      fireEvent.click(document)
    })
    expect(result.current).toBe(false)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(mockTime - 1)
    })
    act(() => {
      fireEvent.click(document)
    })
    expect(result.current).toBe(false)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(mockTime - 1)
    })
    act(() => {
      fireEvent.click(document)
    })
    expect(result.current).toBe(false)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(mockTime - 1)
    })
    act(() => {
      fireEvent.click(document)
    })
    expect(result.current).toBe(false)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(mockTime)
    })
    expect(result.current).toBe(true)
  })

  it(`should always return false if the idle time is exactly ${SLEEP_NEVER_MS}`, async () => {
    const mockTime = SLEEP_NEVER_MS
    const { result } = renderHook(() => useScreenIdle(mockTime, MOCK_OPTIONS))

    expect(result.current).toBe(false)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(SLEEP_NEVER_MS * 2)
    })
    expect(result.current).toBe(false)
  })
})
