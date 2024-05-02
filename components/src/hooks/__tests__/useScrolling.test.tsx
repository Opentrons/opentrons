import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useScrolling } from '../'

describe('useScrolling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.resetAllMocks()
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('returns false when there is no scrolling', () => {
    const ref = document.createElement('div')
    const { result } = renderHook(() => useScrolling(ref))
    expect(result.current).toBe(false)
  })

  it('returns true when scrolling', () => {
    const ref = document.createElement('div')
    const { result } = renderHook(() => useScrolling(ref))
    ref.scrollTop = 10
    act(() => {
      ref.dispatchEvent(new Event('scroll'))
    })
    expect(result.current).toBe(true)
  })

  it('returns false after scrolling stops', () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const ref = document.createElement('div')
    const { result } = renderHook(() => useScrolling(ref))
    ref.scrollTop = 10
    act(() => {
      ref.dispatchEvent(new Event('scroll'))
    })
    expect(result.current).toBe(true)
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe(false)
  })
})
