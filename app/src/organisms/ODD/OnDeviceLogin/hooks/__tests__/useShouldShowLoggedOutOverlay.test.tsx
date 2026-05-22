import { Provider } from 'react-redux'
import { renderHook } from '@testing-library/react'
import { legacy_createStore } from 'redux'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useAccessControlEnabledQuery } from '@opentrons/react-api-client'

import { getIsLoggedInToLocalRobot } from '/app/redux/robot-auth'

import { useShouldShowLoggedOutOverlay } from '../useShouldShowLoggedOutOverlay'

import type { Store } from 'redux'
import type { FunctionComponent, ReactNode } from 'react'
import type { State } from '/app/redux/types'

vi.mock('@opentrons/react-api-client', () => ({
  useAccessControlEnabledQuery: vi.fn(),
}))

vi.mock('/app/redux/robot-auth', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...(actual as any),
    getIsLoggedInToLocalRobot: vi.fn(),
  }
})

const store: Store<State> = legacy_createStore(state => state, {} as State)
const wrapper: FunctionComponent<{ children: ReactNode }> = ({ children }) => (
  <Provider store={store}>{children}</Provider>
)

const mockAccessControlEnabled = (enabled: boolean): void => {
  vi.mocked(useAccessControlEnabledQuery).mockReturnValue({
    data: { data: { accessControlEnabled: enabled } },
    isSuccess: true,
  } as ReturnType<typeof useAccessControlEnabledQuery>)
}

describe('useShouldShowLoggedOutOverlay', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns true when access control is enabled, the user is logged out, and the login modal is closed', () => {
    mockAccessControlEnabled(true)
    vi.mocked(getIsLoggedInToLocalRobot).mockReturnValue(false)

    const { result } = renderHook(() => useShouldShowLoggedOutOverlay(false), {
      wrapper,
    })
    expect(result.current).toBe(true)
  })

  it('returns false when access control is disabled', () => {
    mockAccessControlEnabled(false)
    vi.mocked(getIsLoggedInToLocalRobot).mockReturnValue(false)

    const { result } = renderHook(() => useShouldShowLoggedOutOverlay(false), {
      wrapper,
    })
    expect(result.current).toBe(false)
  })

  it('returns false when the user is logged in', () => {
    mockAccessControlEnabled(true)
    vi.mocked(getIsLoggedInToLocalRobot).mockReturnValue(true)

    const { result } = renderHook(() => useShouldShowLoggedOutOverlay(false), {
      wrapper,
    })
    expect(result.current).toBe(false)
  })

  it('returns false when the login modal is open', () => {
    mockAccessControlEnabled(true)
    vi.mocked(getIsLoggedInToLocalRobot).mockReturnValue(false)

    const { result } = renderHook(() => useShouldShowLoggedOutOverlay(true), {
      wrapper,
    })
    expect(result.current).toBe(false)
  })

  it('returns false when the access-control-enabled query has not resolved', () => {
    vi.mocked(useAccessControlEnabledQuery).mockReturnValue({
      data: undefined,
      isSuccess: false,
    } as ReturnType<typeof useAccessControlEnabledQuery>)
    vi.mocked(getIsLoggedInToLocalRobot).mockReturnValue(false)

    const { result } = renderHook(() => useShouldShowLoggedOutOverlay(false), {
      wrapper,
    })
    expect(result.current).toBe(false)
  })
})
