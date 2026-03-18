import { describe, expect, it, vi } from 'vitest'

import { setRefs } from '../setRefs'

describe('setRefs', () => {
  it('sets current on object refs', () => {
    const refA = { current: null as HTMLInputElement | null }
    const refB = { current: null as HTMLInputElement | null }
    const node = document.createElement('input')

    setRefs<HTMLInputElement>(refA, refB)(node)

    expect(refA.current).toBe(node)
    expect(refB.current).toBe(node)
  })

  it('calls callback refs with node', () => {
    const callbackRef = vi.fn()
    const node = document.createElement('input')

    setRefs<HTMLInputElement>(callbackRef)(node)

    expect(callbackRef).toHaveBeenCalledWith(node)
    expect(callbackRef).toHaveBeenCalledTimes(1)
  })

  it('supports mixed refs and ignores undefined/null refs', () => {
    const callbackRef = vi.fn()
    const objectRef = { current: null as HTMLInputElement | null }
    const node = document.createElement('input')

    setRefs<HTMLInputElement>(undefined, null, callbackRef, objectRef)(node)

    expect(callbackRef).toHaveBeenCalledWith(node)
    expect(objectRef.current).toBe(node)
  })

  it('propagates null node to refs', () => {
    const callbackRef = vi.fn()
    const objectRef = { current: document.createElement('input') }

    setRefs<HTMLInputElement>(callbackRef, objectRef)(null)

    expect(callbackRef).toHaveBeenCalledWith(null)
    expect(objectRef.current).toBeNull()
  })
})
