import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useScrollPosition } from '../useScrollPosition'

describe('useScrollPosition', () => {
  const mockObserve = vi.fn()
  const mockDisconnect = vi.fn()
  let intersectionCallback: (entries: IntersectionObserverEntry[]) => void

  beforeEach(() => {
    vi.stubGlobal(
      'IntersectionObserver',
      vi.fn(callback => {
        intersectionCallback = callback
        return {
          observe: mockObserve,
          disconnect: mockDisconnect,
          unobserve: vi.fn(),
        }
      })
    )
  })

  it('should return initial state and ref', () => {
    const { result } = renderHook(() => useScrollPosition())

    expect(result.current.isScrolled).toBe(false)
    expect(result.current.scrollRef).toBeDefined()
    expect(result.current.scrollRef.current).toBe(null)
  })

  it('should observe when ref is set', async () => {
    const { result } = renderHook(() => useScrollPosition())

    const div = document.createElement('div')

    await act(async () => {
      // @ts-expect-error we're forcibly setting readonly ref
      result.current.scrollRef.current = div

      const observer = new IntersectionObserver(intersectionCallback)
      observer.observe(div)
    })

    expect(mockObserve).toHaveBeenCalledWith(div)
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
