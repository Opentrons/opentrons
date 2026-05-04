import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { showLoginModal } from '/app/organisms/ODD/OnDeviceLogin'

import { useRequireLogin } from '../useRequireLogin'

vi.mock('/app/organisms/ODD/OnDeviceLogin', () => ({
  showLoginModal: vi.fn(),
}))

describe('useRequireLogin', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('resolves with the current username when already logged in', async () => {
    const { result } = renderHook(() => useRequireLogin('alice'))

    const guarded = await act(async () => await result.current())
    expect(guarded).toEqual({ username: 'alice' })
    expect(showLoginModal).not.toHaveBeenCalled()
  })

  it('opens the login modal when logged out, and resolves with the new username on success', async () => {
    vi.mocked(showLoginModal).mockResolvedValue({ username: 'bob' })

    const { result } = renderHook(() => useRequireLogin(null))

    const guarded = await act(async () => await result.current())
    expect(guarded).toEqual({ username: 'bob' })
    expect(showLoginModal).toHaveBeenCalledOnce()
  })

  it('returns null when the user dismisses the login modal', async () => {
    vi.mocked(showLoginModal).mockResolvedValue(null)

    const { result } = renderHook(() => useRequireLogin(null))

    const guarded = await act(async () => await result.current())
    expect(guarded).toBeNull()
  })
})
