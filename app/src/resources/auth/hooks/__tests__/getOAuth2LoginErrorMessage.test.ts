import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getOAuth2LoginErrorMessage } from '../getOAuth2LoginErrorMessage'

const mockT = vi.fn((key: string, options?: { attemptsRemaining?: number }) => {
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

function getMessage(data: Record<string, unknown>): string {
  return getOAuth2LoginErrorMessage(axiosError(data), mockT as any)
}

describe('getOAuth2LoginErrorMessage', () => {
  beforeEach(() => {
    mockT.mockClear()
  })

  it('returns the locked message when the account is locked by an admin', () => {
    expect(
      getMessage({
        error: 'invalid_grant',
        opentrons_account_locked: true,
      })
    ).toBe('login_error_locked')
  })

  it('returns the locked message when login attempts are exhausted', () => {
    expect(
      getMessage({
        error: 'invalid_grant',
        opentrons_login_attempts_remaining: 0,
        opentrons_account_locked: true,
      })
    ).toBe('login_error_locked')
  })

  it('returns the attempts remaining message for a failed login', () => {
    expect(
      getMessage({
        error: 'invalid_grant',
        opentrons_login_attempts_remaining: 2,
      })
    ).toBe('incorrect (2 remaining)')
  })

  it('returns the generic incorrect message when no lockout metadata is present', () => {
    expect(
      getMessage({
        error: 'invalid_grant',
      })
    ).toBe('login_error_incorrect')
  })
})
