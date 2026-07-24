import { useDispatch } from 'react-redux'
import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { logIn } from '/app/redux/robot-auth'

import { useStoreLoginState } from '../useStoreLoginState'

vi.mock('react-redux', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...(actual as Record<string, unknown>),
    useDispatch: vi.fn(),
  }
})

describe('useStoreLoginState', () => {
  const mockDispatch = vi.fn()
  const now = 1234

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
    vi.mocked(useDispatch).mockReturnValue(mockDispatch)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('dispatches a login action for the given robot, with a computed expiresAt', () => {
    const { result } = renderHook(() => useStoreLoginState())
    result.current('remote-robot', {
      username: 'test-user',
      fullName: 'Test User',
      accountType: 'user',
    }, {
      token_type: 'Bearer',
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      expires_in: 3600,
    })

    expect(mockDispatch).toHaveBeenCalledWith(
      logIn({
        username: 'test-user',
        fullName: 'Test User',
        accountType: 'user',
        robotName: 'remote-robot',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: now + 3600 * 1000,
      })
    )

    vi.useRealTimers()
  })

  it('does not dispatch when the robot name is null', () => {
    const { result } = renderHook(() => useStoreLoginState())
    result.current(null, {
      username: 'test-user',
      fullName: 'Test User',
      accountType: 'user',
    }, {
      token_type: 'Bearer',
      access_token: 'access-token',
    })

    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('does not dispatch when token type is not Bearer', () => {
    const { result } = renderHook(() => useStoreLoginState())
    result.current('remote-robot', {
      username: 'test-user',
      fullName: 'Test User',
      accountType: 'user',
    }, {
      token_type: 'Basic',
      access_token: 'access-token',
    })

    expect(mockDispatch).not.toHaveBeenCalled()
  })
})
