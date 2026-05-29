import { afterEach, describe, expect, it, vi } from 'vitest'

import { getSelf } from '@opentrons/api-client'

import { showLoginModal } from '/app/organisms/ODD/OnDeviceLogin/LoginModal'
import { getLocalRobot } from '/app/redux/discovery'
import { getLocalRobotAccessToken, logOut } from '/app/redux/robot-auth'
import { store } from '/app/redux/store'

import { requireLogin } from '../requireLogin'

import type { HostConfig } from '@opentrons/api-client'

vi.mock('@opentrons/api-client', () => ({
  getSelf: vi.fn(),
}))

vi.mock('/app/organisms/ODD/OnDeviceLogin/LoginModal', () => ({
  showLoginModal: vi.fn(),
}))

vi.mock('/app/redux/store', () => ({
  store: {
    getState: vi.fn(),
    dispatch: vi.fn(),
  },
}))

vi.mock('/app/redux/discovery', () => ({
  getLocalRobot: vi.fn(),
}))

vi.mock('/app/redux/robot-auth', () => ({
  getLocalRobotAccessToken: vi.fn(),
  logOut: vi.fn((payload: { robotName: string }) => ({
    type: 'logOut',
    payload,
  })),
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
    vi.mocked(store.getState).mockReturnValue({})
    vi.mocked(getLocalRobot).mockReturnValue({ name: 'odd-robot' } as ReturnType<
      typeof getLocalRobot
    >)
    vi.mocked(showLoginModal).mockResolvedValue({ username: 'alice' })

    const result = await requireLogin('alice', HOST_CONFIG)

    expect(result).toEqual({ username: 'alice' })
    expect(store.dispatch).toHaveBeenCalledWith(
      logOut({ robotName: 'odd-robot' })
    )
    expect(showLoginModal).toHaveBeenCalledOnce()
  })

  it('opens the login modal when logged out, and resolves with the new username on success', async () => {
    vi.mocked(showLoginModal).mockResolvedValue({ username: 'bob' })

    const result = await requireLogin(null)

    expect(result).toEqual({ username: 'bob' })
    expect(showLoginModal).toHaveBeenCalledOnce()
    expect(getSelf).not.toHaveBeenCalled()
  })

  it('returns null when the user dismisses the login modal', async () => {
    vi.mocked(showLoginModal).mockResolvedValue(null)

    const result = await requireLogin(null)

    expect(result).toBeNull()
  })

  it('opens the login modal when the self user request fails', async () => {
    vi.mocked(getSelf).mockRejectedValue(new Error('unauthorized'))
    vi.mocked(store.getState).mockReturnValue({})
    vi.mocked(getLocalRobot).mockReturnValue({ name: 'odd-robot' } as ReturnType<
      typeof getLocalRobot
    >)
    vi.mocked(showLoginModal).mockResolvedValue({ username: 'alice' })

    const result = await requireLogin('alice', HOST_CONFIG)

    expect(result).toEqual({ username: 'alice' })
    expect(store.dispatch).toHaveBeenCalledWith(
      logOut({ robotName: 'odd-robot' })
    )
    expect(showLoginModal).toHaveBeenCalledOnce()
  })

  it('uses the local robot host config when none is passed', async () => {
    vi.mocked(store.getState).mockReturnValue({})
    vi.mocked(getLocalRobotAccessToken).mockReturnValue('stored-token')
    vi.mocked(getSelf).mockResolvedValue({
      data: {
        data: {
          username: 'alice',
          resetPassword: false,
        },
      },
    } as Awaited<ReturnType<typeof getSelf>>)

    await requireLogin('alice')

    expect(getSelf).toHaveBeenCalledWith({
      hostname: _ODD_IP_ ?? 'localhost',
      token: 'stored-token',
    })
  })
})
