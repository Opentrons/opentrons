import { Provider } from 'react-redux'
import { renderHook } from '@testing-library/react'
import { legacy_createStore } from 'redux'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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

describe('useShouldShowLoggedOutOverlay', () => {
  let wrapper: FunctionComponent<{ children: ReactNode }>

  beforeEach(() => {
    wrapper = ({ children }) => <Provider store={store}>{children}</Provider>
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns true when access control is enabled, user is logged out, and login page is closed', () => {
    vi.mocked(useAccessControlEnabledQuery).mockReturnValue({
      data: { data: { accessControlEnabled: true } },
      isSuccess: true,
    } as ReturnType<typeof useAccessControlEnabledQuery>)
    vi.mocked(getIsLoggedInToLocalRobot).mockReturnValue(false)
    const isShowingLoginPage = false

    const { result } = renderHook(
      () => useShouldShowLoggedOutOverlay(isShowingLoginPage),
      {
        wrapper,
      }
    )
    expect(result.current).toBe(true)
  })

  it('returns false when access control is disabled', () => {
    vi.mocked(useAccessControlEnabledQuery).mockReturnValue({
      data: { data: { accessControlEnabled: false } },
      isSuccess: true,
    } as ReturnType<typeof useAccessControlEnabledQuery>)
    vi.mocked(getIsLoggedInToLocalRobot).mockReturnValue(false)
    const isShowingLoginPage = false

    const { result } = renderHook(
      () => useShouldShowLoggedOutOverlay(isShowingLoginPage),
      {
        wrapper,
      }
    )
    expect(result.current).toBe(false)
  })

  it('returns false when the user is logged in', () => {
    vi.mocked(useAccessControlEnabledQuery).mockReturnValue({
      data: { data: { accessControlEnabled: true } },
      isSuccess: true,
    } as ReturnType<typeof useAccessControlEnabledQuery>)
    vi.mocked(getIsLoggedInToLocalRobot).mockReturnValue(true)
    const isShowingLoginPage = false

    const { result } = renderHook(
      () => useShouldShowLoggedOutOverlay(isShowingLoginPage),
      {
        wrapper,
      }
    )
    expect(result.current).toBe(false)
  })

  it('returns false when login page is showing', () => {
    vi.mocked(useAccessControlEnabledQuery).mockReturnValue({
      data: { data: { accessControlEnabled: true } },
      isSuccess: true,
    } as ReturnType<typeof useAccessControlEnabledQuery>)
    vi.mocked(getIsLoggedInToLocalRobot).mockReturnValue(false)
    const isShowingLoginPage = true

    const { result } = renderHook(
      () => useShouldShowLoggedOutOverlay(isShowingLoginPage),
      {
        wrapper,
      }
    )
    expect(result.current).toBe(false)
  })
})
