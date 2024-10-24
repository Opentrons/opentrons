import { describe, it, vi, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useIsMobile } from '../useIsMobile'

describe('useIsMobile', () => {
  it('should return true if the window width is less than 768px', () => {
    vi.stubGlobal('innerWidth', 767)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('should return false if the window width is greater than 768px', () => {
    vi.stubGlobal('innerWidth', 769)
    window.dispatchEvent(new Event('resize'))
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })
})
