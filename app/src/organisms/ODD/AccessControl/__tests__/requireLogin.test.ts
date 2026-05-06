import { afterEach, describe, expect, it, vi } from 'vitest'

import { showLoginModal } from '/app/organisms/ODD/OnDeviceLogin/LoginModal'

import { requireLogin } from '../requireLogin'

vi.mock('/app/organisms/ODD/OnDeviceLogin/LoginModal', () => ({
  showLoginModal: vi.fn(),
}))

describe('requireLogin', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('resolves with the current username when already logged in', async () => {
    const result = await requireLogin('alice')
    expect(result).toEqual({ username: 'alice' })
    expect(showLoginModal).not.toHaveBeenCalled()
  })

  it('opens the login modal when logged out, and resolves with the new username on success', async () => {
    vi.mocked(showLoginModal).mockResolvedValue({ username: 'bob' })

    const result = await requireLogin(null)
    expect(result).toEqual({ username: 'bob' })
    expect(showLoginModal).toHaveBeenCalledOnce()
  })

  it('returns null when the user dismisses the login modal', async () => {
    vi.mocked(showLoginModal).mockResolvedValue(null)

    const result = await requireLogin(null)
    expect(result).toBeNull()
  })
})
