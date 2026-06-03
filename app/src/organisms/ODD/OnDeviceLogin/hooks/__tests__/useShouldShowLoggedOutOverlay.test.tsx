import { Provider } from 'react-redux'
import { renderHook } from '@testing-library/react'
import { legacy_createStore } from 'redux'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useAccessControlEnabledQuery,
  useSelfQuery,
} from '@opentrons/react-api-client'

import { getIsLoggedInToLocalRobot } from '/app/redux/robot-auth'

import { useShouldShowLoggedOutOverlay } from '../useShouldShowLoggedOutOverlay'

import type { Store } from 'redux'
import type { FunctionComponent, ReactNode } from 'react'
import type * as ReactRedux from 'react-redux'
import type * as RobotAuth from '/app/redux/robot-auth'
import type { State } from '/app/redux/types'

vi.mock('@opentrons/react-api-client', () => ({
  useAccessControlEnabledQuery: vi.fn(),
  useSelfQuery: vi.fn(),
}))

vi.mock('/app/redux/robot-auth', async importOriginal => {
  const actual = await importOriginal<typeof RobotAuth>()
  return {
    ...actual,
    getIsLoggedInToLocalRobot: vi.fn(),
  }
})

vi.mock('react-redux', async importOriginal => {
  const actual = await importOriginal<typeof ReactRedux>()
  return {
    ...actual,
    useSelector: vi.fn((selector: (state: State) => unknown) =>
      selector({} as State)
    ),
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

const mockSelfQuery = (resetPassword: boolean): void => {
  vi.mocked(useSelfQuery).mockReturnValue({
    data: { data: { resetPassword } },
  } as ReturnType<typeof useSelfQuery>)
}

describe('useShouldShowLoggedOutOverlay', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  beforeEach(() => {
    vi.mocked(getIsLoggedInToLocalRobot).mockReturnValue(false)
    mockSelfQuery(false)
  })

  it('returns true when access control is enabled, the user is logged out, and the login modal is closed', () => {
    mockAccessControlEnabled(true)

    const { result } = renderHook(() => useShouldShowLoggedOutOverlay(false), {
      wrapper,
    })
    expect(result.current).toBe(true)
  })

  it('returns false when access control is disabled', () => {
    mockAccessControlEnabled(false)

    const { result } = renderHook(() => useShouldShowLoggedOutOverlay(false), {
      wrapper,
    })
    expect(result.current).toBe(false)
  })

  it('returns false when the user is logged in', () => {
    mockAccessControlEnabled(true)
    vi.mocked(getIsLoggedInToLocalRobot).mockReturnValue(true)
    mockSelfQuery(false)

    const { result } = renderHook(() => useShouldShowLoggedOutOverlay(false), {
      wrapper,
    })
    expect(result.current).toBe(false)
  })

  it('returns true when the user must reset their password', () => {
    mockAccessControlEnabled(true)
    vi.mocked(getIsLoggedInToLocalRobot).mockReturnValue(true)
    mockSelfQuery(true)

    const { result } = renderHook(() => useShouldShowLoggedOutOverlay(false), {
      wrapper,
    })
    expect(result.current).toBe(true)
  })

  it('returns false when the login modal is open', () => {
    mockAccessControlEnabled(true)

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

    const { result } = renderHook(() => useShouldShowLoggedOutOverlay(false), {
      wrapper,
    })
    expect(result.current).toBe(false)
  })
})
