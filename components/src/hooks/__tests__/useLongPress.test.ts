import { renderHook } from '@testing-library/react'
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
    result.current.enable()
    expect(result.current.isEnabled).toBe(true)
  })

  it('when callling disable, isEnabled false', () => {
    const { result } = renderHook(() => useLongPress())
    result.current.disable()
    expect(result.current.isEnabled).toBe(false)
  })
})
