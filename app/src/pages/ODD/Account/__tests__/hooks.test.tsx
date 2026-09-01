import { Provider } from 'react-redux'
import { renderHook } from '@testing-library/react'
import { legacy_createStore } from 'redux'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useSelfQuery } from '@opentrons/react-api-client'

import { getLocalRobotAuthState } from '/app/redux/robot-auth'

import { useAccountInfo } from '../hooks'

import type { Store } from 'redux'
import type { FunctionComponent, ReactNode } from 'react'
import type { State } from '/app/redux/types'

vi.mock('/app/redux/discovery', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...(actual as object),
    getLocalRobot: vi.fn(),
  }
})

vi.mock('/app/redux/robot-auth', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...(actual as object),
    getLocalRobotAuthState: vi.fn(),
  }
})

vi.mock('@opentrons/react-api-client', () => ({
  useSelfQuery: vi.fn(),
}))

const store: Store<State> = legacy_createStore(state => state, {} as State)

describe('useAccountInfo', () => {
  let wrapper: FunctionComponent<{ children: ReactNode }>

  beforeEach(() => {
    wrapper = ({ children }) => <Provider store={store}>{children}</Provider>
    vi.mocked(useSelfQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    } as any)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns logged-out values for all fields when there is no local robot auth state', () => {
    vi.mocked(getLocalRobotAuthState).mockReturnValue(null)

    const { result } = renderHook(() => useAccountInfo(), { wrapper })

    expect(result.current).toStrictEqual({
      isLoggedIn: false,
      username: null,
      fullName: null,
    })
  })

  it('returns username and fullName when logged in', () => {
    vi.mocked(getLocalRobotAuthState).mockReturnValue({
      user: {
        username: 'test-user',
        fullName: 'Test User Name',
        accountType: 'user',
      },
      accessToken: 'token',
      refreshToken: null,
      expiresAt: null,
    })
    vi.mocked(useSelfQuery).mockReturnValue({
      data: {
        data: {
          username: 'test-user',
          fullName: 'Test User Name',
          accountType: 'user',
          locked: false,
          resetPassword: false,
        },
      },
      isLoading: false,
      isError: false,
    } as any)

    const { result } = renderHook(() => useAccountInfo(), { wrapper })

    expect(result.current).toStrictEqual({
      isLoggedIn: true,
      username: 'test-user',
      fullName: 'Test User Name',
    })
  })

  it('returns null fullName while profile is loading', () => {
    vi.mocked(getLocalRobotAuthState).mockReturnValue({
      user: {
        username: 'test-user',
        fullName: 'Test User Name',
        accountType: 'user',
      },
      accessToken: 'token',
      refreshToken: null,
      expiresAt: null,
    })
    vi.mocked(useSelfQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as any)

    const { result } = renderHook(() => useAccountInfo(), { wrapper })

    expect(result.current.fullName).toBeNull()
  })

  it('returns null fullName when profile request errors', () => {
    vi.mocked(getLocalRobotAuthState).mockReturnValue({
      user: {
        username: 'test-user',
        fullName: 'Test User Name',
        accountType: 'user',
      },
      accessToken: 'token',
      refreshToken: null,
      expiresAt: null,
    })
    vi.mocked(useSelfQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as any)

    const { result } = renderHook(() => useAccountInfo(), { wrapper })

    expect(result.current.fullName).toBeNull()
  })
})
