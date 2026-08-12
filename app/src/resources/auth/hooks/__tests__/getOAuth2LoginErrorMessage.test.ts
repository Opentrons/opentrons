import { describe, expect, it, vi } from 'vitest'

import { getOAuth2LoginErrorMessage } from '../getOAuth2LoginErrorMessage'

const t = vi.fn((key: string, options?: { attemptsRemaining?: number }) => {
  if (key === 'login_error_incorrect_with_attempts_remaining') {
    return `incorrect (${options?.attemptsRemaining} remaining)`
  }
  return key
})

function axiosError(data: Record<string, unknown>): unknown {
  return {
    isAxiosError: true,
    message: 'Request failed',
    response: {
      status: 400,
      data,
    },
  }
}

describe('getOAuth2LoginErrorMessage', () => {
  it('returns the locked message when the account is locked by an admin', () => {
    const message = getOAuth2LoginErrorMessage(
      axiosError({
        error: 'invalid_grant',
        opentrons_account_locked: true,
      }),
      t
    )

    expect(message).toBe('login_error_locked')
  })

  it('returns the locked message when login attempts are exhausted', () => {
    const message = getOAuth2LoginErrorMessage(
      axiosError({
        error: 'invalid_grant',
        opentrons_login_attempts_remaining: 0,
        opentrons_account_locked: true,
      }),
      t
    )

    expect(message).toBe('login_error_locked')
  })

  it('returns the attempts remaining message for a failed login', () => {
    const message = getOAuth2LoginErrorMessage(
      axiosError({
        error: 'invalid_grant',
        opentrons_login_attempts_remaining: 2,
      }),
      t
    )

    expect(message).toBe('incorrect (2 remaining)')
  })

  it('returns the generic incorrect message when no lockout metadata is present', () => {
    const message = getOAuth2LoginErrorMessage(
      axiosError({
        error: 'invalid_grant',
      }),
      t
    )

    expect(message).toBe('login_error_incorrect')
  })
})
