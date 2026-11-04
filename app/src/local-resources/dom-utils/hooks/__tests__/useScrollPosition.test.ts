import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useScrollPosition } from '../useScrollPosition'

describe('useScrollPosition', () => {
  let mockObserve: ReturnType<typeof vi.fn>
  let mockDisconnect: ReturnType<typeof vi.fn>
  let intersectionCallback: (entries: IntersectionObserverEntry[]) => void

  beforeEach(() => {
    mockObserve = vi.fn()
    mockDisconnect = vi.fn()

    class MockIntersectionObserver {
      public observe = mockObserve
      public disconnect = mockDisconnect
      public unobserve = vi.fn()

      public constructor(
        callback: (entries: IntersectionObserverEntry[]) => void
      ) {
        intersectionCallback = callback
      }
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
  })

  it('should return initial state and ref', () => {
    const { result } = renderHook(() => useScrollPosition())

    expect(result.current.isScrolled).toBe(false)
    expect(result.current.scrollRef).toBeDefined()
    expect(result.current.scrollRef.current).toBe(null)
  })

  it('should create an intersection observer on mount', () => {
    const { result } = renderHook(() => useScrollPosition())
    expect(result.current.scrollRef.current).toBe(null)
    expect(intersectionCallback).toBeTypeOf('function')
  })

  it('should update isScrolled when intersection changes for both scrolled and unscrolled cases', () => {
    const { result } = renderHook(() => useScrollPosition())

    act(() => {
      intersectionCallback([
        { isIntersecting: false } as IntersectionObserverEntry,
      ])
    })

    expect(result.current.isScrolled).toBe(true)

    act(() => {
      intersectionCallback([
        { isIntersecting: true } as IntersectionObserverEntry,
      ])
    })

    expect(result.current.isScrolled).toBe(false)
  })

  it('should disconnect observer on unmount', () => {
    const { unmount } = renderHook(() => useScrollPosition())

    unmount()

    expect(mockDisconnect).toHaveBeenCalled()
  })
})
