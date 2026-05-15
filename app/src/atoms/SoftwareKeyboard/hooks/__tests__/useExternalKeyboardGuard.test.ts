import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useExternalKeyboardGuard } from '../useExternalKeyboardGuard'

describe('useExternalKeyboardGuard - alphanumeric', () => {
  it('returns null invalidChar on mount', () => {
    const { result } = renderHook(() => useExternalKeyboardGuard('alphanumeric'))
    expect(result.current.invalidChar).toBeNull()
  })

  it('allows lowercase letters', () => {
    const { result } = renderHook(() => useExternalKeyboardGuard('alphanumeric'))
    let accepted = false
    act(() => {
      accepted = result.current.validateInput('abc', '')
    })
    expect(accepted).toBe(true)
    expect(result.current.invalidChar).toBeNull()
  })

  it('allows uppercase letters', () => {
    const { result } = renderHook(() => useExternalKeyboardGuard('alphanumeric'))
    let accepted = false
    act(() => {
      accepted = result.current.validateInput('ABC', '')
    })
    expect(accepted).toBe(true)
    expect(result.current.invalidChar).toBeNull()
  })

  it('allows digits', () => {
    const { result } = renderHook(() => useExternalKeyboardGuard('alphanumeric'))
    let accepted = false
    act(() => {
      accepted = result.current.validateInput('123', '')
    })
    expect(accepted).toBe(true)
    expect(result.current.invalidChar).toBeNull()
  })

  it('accepts invalid char and sets invalidChar state', () => {
    const { result } = renderHook(() => useExternalKeyboardGuard('alphanumeric'))
    let accepted = false
    act(() => {
      accepted = result.current.validateInput('a!', 'a')
    })
    expect(accepted).toBe(true)
    expect(result.current.invalidChar).toBe('!')
  })

  it('blocks further additions while invalidChar is set', () => {
    const { result } = renderHook(() => useExternalKeyboardGuard('alphanumeric'))
    act(() => {
      result.current.validateInput('a!', 'a')
    })
    expect(result.current.invalidChar).toBe('!')
    let blocked = false
    act(() => {
      blocked = !result.current.validateInput('a!b', 'a!')
    })
    expect(blocked).toBe(true)
    expect(result.current.invalidChar).toBe('!')
  })

  it('allows deletion while in invalid state', () => {
    const { result } = renderHook(() => useExternalKeyboardGuard('alphanumeric'))
    act(() => {
      result.current.validateInput('a!', 'a')
    })
    let accepted = false
    act(() => {
      accepted = result.current.validateInput('a', 'a!')
    })
    expect(accepted).toBe(true)
    expect(result.current.invalidChar).toBeNull()
  })

  it('clears invalidChar only when all invalid chars are removed', () => {
    const { result } = renderHook(() => useExternalKeyboardGuard('alphanumeric'))
    act(() => {
      result.current.validateInput('a!@', 'a')
    })
    expect(result.current.invalidChar).toBe('!')
    // Delete one char — '!' remains
    act(() => {
      result.current.validateInput('a!', 'a!@')
    })
    expect(result.current.invalidChar).toBe('!')
    // Delete invalid char — all valid now
    act(() => {
      result.current.validateInput('a', 'a!')
    })
    expect(result.current.invalidChar).toBeNull()
  })

  it('blocks space character', () => {
    const { result } = renderHook(() => useExternalKeyboardGuard('alphanumeric'))
    let accepted = false
    act(() => {
      accepted = result.current.validateInput('a b', 'a')
    })
    expect(accepted).toBe(true)
    expect(result.current.invalidChar).toBe(' ')
  })

  it('handles paste: records first invalid char, blocks further additions', () => {
    const { result } = renderHook(() => useExternalKeyboardGuard('alphanumeric'))
    let accepted = false
    act(() => {
      accepted = result.current.validateInput('ab!c@', '')
    })
    expect(accepted).toBe(true)
    expect(result.current.invalidChar).toBe('!')
    // Now try to add more
    act(() => {
      accepted = result.current.validateInput('ab!c@d', 'ab!c@')
    })
    expect(accepted).toBe(false)
  })
})

describe('useExternalKeyboardGuard - numerical', () => {
  it('allows digits for int keyboard', () => {
    const { result } = renderHook(() => useExternalKeyboardGuard('numerical'))
    let accepted = false
    act(() => {
      accepted = result.current.validateInput('123', '')
    })
    expect(accepted).toBe(true)
    expect(result.current.invalidChar).toBeNull()
  })

  it('accepts decimal point entered and sets invalidChar for intKeyboard', () => {
    const { result } = renderHook(() =>
      useExternalKeyboardGuard('numerical', { isDecimal: false })
    )
    let accepted = false
    act(() => {
      accepted = result.current.validateInput('1.', '1')
    })
    expect(accepted).toBe(true)
    expect(result.current.invalidChar).toBe('.')
  })

  it('allows decimal point when isDecimal=true', () => {
    const { result } = renderHook(() =>
      useExternalKeyboardGuard('numerical', { isDecimal: true })
    )
    let accepted = false
    act(() => {
      accepted = result.current.validateInput('1.', '1')
    })
    expect(accepted).toBe(true)
    expect(result.current.invalidChar).toBeNull()
  })

  it('accepts hyphen entered and sets invalidChar when hasHyphen=false', () => {
    const { result } = renderHook(() =>
      useExternalKeyboardGuard('numerical', { hasHyphen: false })
    )
    let accepted = false
    act(() => {
      accepted = result.current.validateInput('-1', '')
    })
    expect(accepted).toBe(true)
    expect(result.current.invalidChar).toBe('-')
  })

  it('allows hyphen when hasHyphen=true', () => {
    const { result } = renderHook(() =>
      useExternalKeyboardGuard('numerical', { hasHyphen: true })
    )
    let accepted = false
    act(() => {
      accepted = result.current.validateInput('-1', '')
    })
    expect(accepted).toBe(true)
    expect(result.current.invalidChar).toBeNull()
  })
})
