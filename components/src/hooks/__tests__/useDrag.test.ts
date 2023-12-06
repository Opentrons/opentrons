import { renderHook } from '@testing-library/react'
import { useDrag } from '../useDrag'
import type { ElementPosition } from '../useDrag'

const mockPosition: ElementPosition = {
  width: 100,
  height: 200,
  x: 10,
  y: 20,
}

describe('useDrag', () => {
  it('useDrag returns UseDragResult', () => {
    const { result } = renderHook(() => useDrag(mockPosition))

    expect(result.current.position.width).toBe(mockPosition.width)
    expect(result.current.position.height).toBe(mockPosition.height)
    expect(result.current.position.x).toBe(mockPosition.x)
    expect(result.current.position.y).toBe(mockPosition.y)
    expect(result.current.style.width).toBe(`${mockPosition.width}px`)
    expect(result.current.style.height).toBe(`${mockPosition.height}px`)
    expect(result.current.style.touchAction).toBe('none')
    expect(result.current.style.transform).toBe(
      `translate3D(${mockPosition.x}px, ${mockPosition.y}px, 0)`
    )
    expect(result.current.style.position).toBe('absolute')
    expect(typeof result.current.isEnabled).toBe('boolean')
  })

  it('When calling enable, isEnabled true', () => {
    const { result } = renderHook(() => useDrag(mockPosition))
    result.current.enable()
    expect(result.current.isEnabled).toBe(true)
  })

  it('When calling disable, isEnabled false', () => {
    const { result } = renderHook(() => useDrag(mockPosition))
    result.current.disable()
    expect(result.current.isEnabled).toBe(false)
  })
})
