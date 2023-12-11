import { act, renderHook, waitFor } from '@testing-library/react'
import { useLongPress } from '../useLongPress'

describe('useLongPress', () => {
  it('useLongPress returns typeof UseLongPressResult', () => {
    const { result } = renderHook(() => useLongPress())
    expect(result.current.style.touchAction).toBe('none')
    expect(result.current.isEnabled).toBe(true)
    expect(result.current.isLongPressed).toBe(false)
    expect(result.current.isTapped).toBe(false)
  })

  it('when callling disable, isEnabled true', () => {
    const { result } = renderHook(() => useLongPress())
    act(() => result.current.enable())
    waitFor(() => (
      expect(result.current.isEnabled).toBe(true)
    ))
  })

  it('when callling disable, isEnabled false', () => {
    const { result } = renderHook(() => useLongPress())
    act(() => result.current.disable())
    waitFor(() => (
      expect(result.current.isEnabled).toBe(false)
    ))
  })
})
