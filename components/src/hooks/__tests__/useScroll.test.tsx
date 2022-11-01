import { renderHook } from '@testing-library/react-hooks'
import { useScroll } from '..'

describe('useSwipe hook', () => {
  it('useSwipe returns UseSwipeResult object', () => {
    const { result } = renderHook(() => useScroll())
    expect(result.current.style.touchAction).toBe('none')
    expect(result.current.isEnabled).toBe(true)
  })

  it('When calling enable, isEnabled true', () => {
    const { result } = renderHook(() => useScroll())
    result.current.enable()
    expect(result.current.isEnabled).toBe(true)
  })

  it('When calling disable, isEnabled false', () => {
    const { result } = renderHook(() => useScroll())
    result.current.disable()
    expect(result.current.isEnabled).toBe(false)
  })
})
