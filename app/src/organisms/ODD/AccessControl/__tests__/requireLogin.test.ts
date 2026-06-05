import { afterEach, describe, expect, it, vi } from 'vitest'

import { getSelf } from '@opentrons/api-client'

import { showLoginModal } from '/app/organisms/ODD/OnDeviceLogin/LoginModal'

import { requireLogin } from '../requireLogin'

import type { HostConfig } from '@opentrons/api-client'

vi.mock('@opentrons/api-client', () => ({
  getSelf: vi.fn(),
}))

vi.mock('/app/organisms/ODD/OnDeviceLogin/LoginModal', () => ({
  showLoginModal: vi.fn(),
}))

const HOST_CONFIG: HostConfig = {
  hostname: 'localhost',
  token: 'access-token',
}

describe('requireLogin', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('resolves with the current username when already logged in and reset is not required', async () => {
    vi.mocked(getSelf).mockResolvedValue({
      data: {
        data: {
          username: 'alice',
          resetPassword: false,
        },
      },
    } as Awaited<ReturnType<typeof getSelf>>)

    const result = await requireLogin('alice', HOST_CONFIG)

    expect(result).toEqual({ username: 'alice' })
    expect(showLoginModal).not.toHaveBeenCalled()
    expect(getSelf).toHaveBeenCalledWith(HOST_CONFIG)
  })

  it('opens the login modal when resetPassword is true', async () => {
    vi.mocked(getSelf).mockResolvedValue({
      data: {
        data: {
          username: 'alice',
          resetPassword: true,
        },
      },
    } as Awaited<ReturnType<typeof getSelf>>)
    vi.mocked(showLoginModal).mockResolvedValue({ username: 'alice' })

    const result = await requireLogin('alice', HOST_CONFIG)

    expect(result).toEqual({ username: 'alice' })
    expect(showLoginModal).toHaveBeenCalledOnce()
  })

  it('opens the login modal when logged out, and resolves with the new username on success', async () => {
    vi.mocked(showLoginModal).mockResolvedValue({ username: 'bob' })

    const result = await requireLogin(null, null)

    expect(result).toEqual({ username: 'bob' })
    expect(showLoginModal).toHaveBeenCalledOnce()
    expect(getSelf).not.toHaveBeenCalled()
  })

  it('returns null when the user dismisses the login modal', async () => {
    vi.mocked(showLoginModal).mockResolvedValue(null)

    const result = await requireLogin(null, null)

    expect(result).toBeNull()
  })

  it('resolves with the current username when the self user request fails', async () => {
    vi.mocked(getSelf).mockRejectedValue(new Error('unauthorized'))

    const result = await requireLogin('alice', HOST_CONFIG)

    expect(result).toEqual({ username: 'alice' })
    expect(showLoginModal).not.toHaveBeenCalled()
  })
})
