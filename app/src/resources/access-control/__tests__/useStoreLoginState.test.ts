import { useDispatch, useSelector } from 'react-redux'
import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { logIn } from '/app/redux/robot-auth'

import { useStoreLoginState } from '../useStoreLoginState'

vi.mock('react-redux', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...(actual as Record<string, unknown>),
    useDispatch: vi.fn(),
    useSelector: vi.fn(),
  }
})

describe('useStoreLoginState', () => {
  const mockDispatch = vi.fn()
  const now = 1234

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('dispatches a login action with values from the response, and a computed expiresAt', () => {
    vi.mocked(useDispatch).mockReturnValue(mockDispatch)
    vi.mocked(useSelector).mockReturnValue('local-robot')

    const { result } = renderHook(() => useStoreLoginState())
    result.current('test-user', {
      token_type: 'Bearer',
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      expires_in: 3600,
    })

    expect(mockDispatch).toHaveBeenCalledWith(
      logIn({
        username: 'test-user',
        robotName: 'local-robot',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: now + 3600 * 1000,
      })
    )

    vi.useRealTimers()
  })

  it("does not dispatch when local robot can't be identified", () => {
    vi.mocked(useDispatch).mockReturnValue(mockDispatch)
    vi.mocked(useSelector).mockReturnValue(null)

    const { result } = renderHook(() => useStoreLoginState())
    result.current('test-user', {
      token_type: 'Bearer',
      access_token: 'access-token',
    })

    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('does not dispatch when token type is not Bearer', () => {
    vi.mocked(useDispatch).mockReturnValue(mockDispatch)
    vi.mocked(useSelector).mockReturnValue('local-robot')

    const { result } = renderHook(() => useStoreLoginState())
    result.current('test-user', {
      token_type: 'Basic',
      access_token: 'access-token',
    })

    expect(mockDispatch).not.toHaveBeenCalled()
  })
})
