import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { showLoginNiceModal } from '/app/organisms/ODD/OnDeviceLogin'

import { useRequireLogin } from '../useRequireLogin'

vi.mock('/app/organisms/ODD/OnDeviceLogin', () => ({
  showLoginNiceModal: vi.fn(),
}))

describe('useRequireLogin', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('resolves with the current username when already logged in', async () => {
    const { result } = renderHook(() => useRequireLogin('alice'))

    const guarded = await act(async () => await result.current())
    expect(guarded).toEqual({ username: 'alice' })
    expect(showLoginNiceModal).not.toHaveBeenCalled()
  })

  it('opens the login modal when logged out, and resolves with the new username on success', async () => {
    vi.mocked(showLoginNiceModal).mockResolvedValue({ username: 'bob' })

    const { result } = renderHook(() => useRequireLogin(null))

    const guarded = await act(async () => await result.current())
    expect(guarded).toEqual({ username: 'bob' })
    expect(showLoginNiceModal).toHaveBeenCalledOnce()
  })

  it('returns null when the user dismisses the login modal', async () => {
    vi.mocked(showLoginNiceModal).mockResolvedValue(null)

    const { result } = renderHook(() => useRequireLogin(null))

    const guarded = await act(async () => await result.current())
    expect(guarded).toBeNull()
  })
})
