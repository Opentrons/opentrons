import { renderHook, act } from '@testing-library/react'
import { useScrolling } from '../'

describe('useScrolling', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  it('returns false when there is no scrolling', () => {
    const ref = { current: document.createElement('div') }
    const { result } = renderHook(() => useScrolling(ref))
    expect(result.current).toBe(false)
  })

  it('returns true when scrolling', () => {
    const ref = { current: document.createElement('div') }
    const { result } = renderHook(() => useScrolling(ref))
    ref.current.scrollTop = 10
    act(() => {
      ref.current.dispatchEvent(new Event('scroll'))
    })
    expect(result.current).toBe(true)
  })

  it('returns false after scrolling stops', () => {
    const ref = { current: document.createElement('div') }
    const { result } = renderHook(() => useScrolling(ref))
    ref.current.scrollTop = 10
    act(() => {
      ref.current.dispatchEvent(new Event('scroll'))
    })
    expect(result.current).toBe(true)
    act(() => {
      jest.runTimersToTime(300)
    })
    jest.runTimersToTime(300)
    expect(result.current).toBe(false)
  })
})
