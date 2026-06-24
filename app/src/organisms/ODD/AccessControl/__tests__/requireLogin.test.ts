import { QueryClient } from 'react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { fetchSelfQuery } from '@opentrons/react-api-client'

import { showLoginModal } from '/app/organisms/ODD/OnDeviceLogin/LoginModal'

import { requireLogin } from '../requireLogin'

import type { AuthUserResponse, HostConfig } from '@opentrons/api-client'

vi.mock('@opentrons/react-api-client', async importOriginal => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    fetchSelfQuery: vi.fn(),
  }
})

vi.mock('/app/organisms/ODD/OnDeviceLogin/LoginModal', () => ({
  showLoginModal: vi.fn(),
}))

const HOST_CONFIG: HostConfig = {
  hostname: 'localhost',
  token: 'access-token',
}

const QUERY_CLIENT = new QueryClient()

describe('requireLogin', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('resolves with the current username when already logged in and reset is not required', async () => {
    vi.mocked(fetchSelfQuery).mockResolvedValue({
      data: {
        username: 'alice',
        resetPassword: false,
      },
    } as AuthUserResponse)

    const result = await requireLogin(QUERY_CLIENT, 'alice', HOST_CONFIG)

    expect(result).toEqual({ username: 'alice' })
    expect(showLoginModal).not.toHaveBeenCalled()
    expect(fetchSelfQuery).toHaveBeenCalledWith(QUERY_CLIENT, HOST_CONFIG)
  })

  it('opens the login modal when resetPassword is true', async () => {
    vi.mocked(fetchSelfQuery).mockResolvedValue({
      data: {
        username: 'alice',
        resetPassword: true,
      },
    } as AuthUserResponse)
    vi.mocked(showLoginModal).mockResolvedValue({ username: 'alice' })

    const result = await requireLogin(QUERY_CLIENT, 'alice', HOST_CONFIG)

    expect(result).toEqual({ username: 'alice' })
    expect(showLoginModal).toHaveBeenCalledWith(QUERY_CLIENT, HOST_CONFIG)
  })

  it('opens the login modal when logged out, and resolves with the new username on success', async () => {
    vi.mocked(showLoginModal).mockResolvedValue({ username: 'bob' })

    const result = await requireLogin(QUERY_CLIENT, null, null)

    expect(result).toEqual({ username: 'bob' })
    expect(showLoginModal).toHaveBeenCalledWith(QUERY_CLIENT, null)
    expect(fetchSelfQuery).not.toHaveBeenCalled()
  })

  it('returns null when the user dismisses the login modal', async () => {
    vi.mocked(showLoginModal).mockResolvedValue(null)

    const result = await requireLogin(QUERY_CLIENT, null, null)

    expect(result).toBeNull()
  })

  it('resolves with the current username when the self user request fails', async () => {
    vi.mocked(fetchSelfQuery).mockRejectedValue(new Error('unauthorized'))

    const result = await requireLogin(QUERY_CLIENT, 'alice', HOST_CONFIG)

    expect(result).toEqual({ username: 'alice' })
    expect(showLoginModal).not.toHaveBeenCalled()
  })
})
