import { renderHook } from '@testing-library/react'
import { useIdle } from '../useIdle'

const MOCK_EVENTS: Array<keyof DocumentEventMap> = [
  'mousedown',
  'click',
  'scroll',
]

const MOCK_OPTIONS = {
  events: MOCK_EVENTS,
  initialState: false,
}

describe('useIdle', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  it('should return the default initialState', () => {
    const mockTime = 1000
    const { result } = renderHook(() => useIdle(mockTime))
    expect(result.current).toBe(true)
  })

  it('should return the given initialState', () => {
    const mockTime = 1000
    const { result } = renderHook(() => useIdle(mockTime, MOCK_OPTIONS))
    expect(result.current).toBe(false)
  })

  it('should return true after 1000ms', () => {
    const mockTime = 1000
    const { result } = renderHook(() => useIdle(mockTime, MOCK_OPTIONS))
    expect(result.current).toBe(false)
    setTimeout(() => {
      expect(result.current).toBe(true)
    }, 1001)
  })

  it('should return true after 180,000ms - 3min', () => {
    const mockTime = 60 * 1000 * 3
    const { result } = renderHook(() => useIdle(mockTime, MOCK_OPTIONS))
    expect(result.current).toBe(false)
    setTimeout(() => {
      expect(result.current).toBe(true)
    }, 180001)
  })

  it('should return true after 180,0000ms - 30min', () => {
    const mockTime = 60 * 1000 * 30
    const { result } = renderHook(() => useIdle(mockTime, MOCK_OPTIONS))
    expect(result.current).toBe(false)
    setTimeout(() => {
      expect(result.current).toBe(true)
    }, 1800001)
  })

  it('should return true after 3,600,000ms - 1 hour', () => {
    const mockTime = 60 * 1000 * 60
    const { result } = renderHook(() => useIdle(mockTime, MOCK_OPTIONS))
    expect(result.current).toBe(false)
    setTimeout(() => {
      expect(result.current).toBe(true)
    }, 3600001)
  })
})
