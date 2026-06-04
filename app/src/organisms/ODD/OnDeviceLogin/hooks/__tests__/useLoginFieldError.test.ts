import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useLoginFieldError } from '../useLoginFieldError'

describe('useLoginFieldError', () => {
  it('returns login error on password step when set', () => {
    const { result } = renderHook(() =>
      useLoginFieldError({
        step: 'password',
        loginError: 'Invalid credentials',
        confirmPasswordError: null,
      })
    )

    expect(result.current).toBe('Invalid credentials')
  })

  it('returns null on password step when login error is empty', () => {
    const { result } = renderHook(() =>
      useLoginFieldError({
        step: 'password',
        loginError: '',
        confirmPasswordError: null,
      })
    )

    expect(result.current).toBeNull()
  })

  it('returns confirm password error on confirm step', () => {
    const { result } = renderHook(() =>
      useLoginFieldError({
        step: 'confirmPassword',
        loginError: 'Invalid credentials',
        confirmPasswordError: 'Passwords do not match',
      })
    )

    expect(result.current).toBe('Passwords do not match')
  })

  it('returns null on username step even when login error is set', () => {
    const { result } = renderHook(() =>
      useLoginFieldError({
        step: 'username',
        loginError: 'Invalid credentials',
        confirmPasswordError: null,
      })
    )

    expect(result.current).toBeNull()
  })
})
