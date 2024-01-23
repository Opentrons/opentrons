import { act, renderHook } from '@testing-library/react'
import { useSwipe } from '..'

describe('useSwipe hook', () => {
  it('useSwipe returns UseSwipeResult object', () => {
    const { result } = renderHook(() => useSwipe())
    expect(result.current.style.touchAction).toBe('none')
    expect(result.current.isEnabled).toBe(true)
    expect(result.current.swipeType).toBe('')
  })

  it('When calling enable, isEnabled true', () => {
    const { result } = renderHook(() => useSwipe())
    result.current.enable()
    expect(result.current.isEnabled).toBe(true)
  })

  it('When calling disable, isEnabled false', () => {
    const { result } = renderHook(() => useSwipe())
    act(() => {
      result.current.disable()
    })
    expect(result.current.isEnabled).toBe(false)
  })
})
