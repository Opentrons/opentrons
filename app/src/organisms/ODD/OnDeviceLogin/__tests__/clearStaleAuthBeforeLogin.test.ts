import { QueryClient } from 'react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchSelfQuery } from '@opentrons/react-api-client'

import { getLocalRobot } from '/app/redux/discovery'
import { logOut } from '/app/redux/robot-auth'
import { store } from '/app/redux/store'

import { clearStaleAuthBeforeLogin } from '../clearStaleAuthBeforeLogin'

import type { AuthUserResponse, HostConfig } from '@opentrons/api-client'

vi.mock('@opentrons/react-api-client', async importOriginal => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    fetchSelfQuery: vi.fn(),
  }
})

vi.mock('/app/redux/discovery', async importOriginal => {
  const actual = await importOriginal<typeof getLocalRobot>()
  return {
    ...actual,
    getLocalRobot: vi.fn(),
  }
})

vi.mock('/app/redux/robot-auth', () => ({
  logOut: vi.fn(),
}))

vi.mock('/app/redux/store', () => ({
  store: {
    getState: vi.fn(() => ({})),
    dispatch: vi.fn(),
  },
}))

const QUERY_CLIENT = new QueryClient()
const HOST_CONFIG: HostConfig = {
  hostname: 'localhost',
  token: 'access-token',
}

describe('clearStaleAuthBeforeLogin', () => {
  beforeEach(() => {
    vi.mocked(getLocalRobot).mockReturnValue(null)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('logs out when getSelf reports resetPassword', async () => {
    vi.mocked(getLocalRobot).mockReturnValue({
      name: 'odd-robot',
    } as ReturnType<typeof getLocalRobot>)
    vi.mocked(fetchSelfQuery).mockResolvedValue({
      data: {
        username: 'alice',
        resetPassword: true,
      },
    } as AuthUserResponse)

    await clearStaleAuthBeforeLogin(QUERY_CLIENT, HOST_CONFIG)

    expect(fetchSelfQuery).toHaveBeenCalledWith(QUERY_CLIENT, HOST_CONFIG)
    expect(logOut).toHaveBeenCalledWith({ robotName: 'odd-robot' })
    expect(store.dispatch).toHaveBeenCalled()
  })

  it('does nothing when there is no local robot', async () => {
    await clearStaleAuthBeforeLogin(QUERY_CLIENT, HOST_CONFIG)

    expect(fetchSelfQuery).not.toHaveBeenCalled()
    expect(logOut).not.toHaveBeenCalled()
  })

  it('does nothing when there is no auth token', async () => {
    vi.mocked(getLocalRobot).mockReturnValue({
      name: 'odd-robot',
    } as ReturnType<typeof getLocalRobot>)

    await clearStaleAuthBeforeLogin(QUERY_CLIENT, {
      hostname: 'localhost',
    })

    expect(fetchSelfQuery).not.toHaveBeenCalled()
    expect(logOut).not.toHaveBeenCalled()
  })
})
