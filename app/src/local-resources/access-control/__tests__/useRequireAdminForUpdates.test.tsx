import { I18nextProvider } from 'react-i18next'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { WARNING_TOAST } from '@opentrons/components'
import {
  fetchSelfQuery,
  getSelfQueryKey,
  useAccessControlEnabledQuery,
  useAuthSettingsQuery,
  useHost,
  useSelfQuery,
} from '@opentrons/react-api-client'

import { i18n } from '/app/i18n'
// eslint-disable-next-line opentrons/no-imports-across-applications
import { useToaster } from '/app/organisms/ToasterOven'
import { useRobot } from '/app/redux-resources/robots'
import { getIsOnDevice } from '/app/redux/config'
import { logOut } from '/app/redux/robot-auth'

import { useRequireAdminForUpdates } from '../useRequireAdminForUpdates'
import {
  mockShowLoginModal,
  wrapWithDocumentationRequiredModal,
} from './documentationRequiredModalTestUtils'

import type { FunctionComponent, ReactNode } from 'react'
import type ReactRedux from 'react-redux'

const ROBOT_NAME = 'otie'
const HOST = {
  hostname: '1.2.3.4',
  port: 31950,
  robotName: ROBOT_NAME,
  token: 'token',
}

const mockDispatch = vi.fn()
const mockMakeToast = vi.fn(() => 'toast-id')
const mockEatToast = vi.fn()
const mockRemoveQueries = vi.fn()

vi.mock('@opentrons/react-api-client', async importOriginal => {
  const actual = await importOriginal<Record<string, unknown>>()
  return {
    ...actual,
    useAccessControlEnabledQuery: vi.fn(),
    useAuthSettingsQuery: vi.fn(),
    useSelfQuery: vi.fn(),
    useHost: vi.fn(),
    fetchSelfQuery: vi.fn(() => Promise.resolve()),
    getSelfQueryKey: vi.fn(() => ['self']),
  }
})

vi.mock('react-redux', async importOriginal => {
  const actual = await importOriginal<typeof ReactRedux>()
  return {
    ...actual,
    useDispatch: () => mockDispatch,
    useSelector: (selector: (state: unknown) => unknown) => selector({}),
  }
})

vi.mock('react-query', async importOriginal => {
  const actual = await importOriginal<Record<string, unknown>>()
  return {
    ...actual,
    useQueryClient: () => ({ removeQueries: mockRemoveQueries }),
  }
})

vi.mock('/app/organisms/ToasterOven')
vi.mock('/app/redux/config', async importOriginal => {
  const actual = await importOriginal<Record<string, unknown>>()
  return {
    ...actual,
    getIsOnDevice: vi.fn(() => false),
  }
})
vi.mock('/app/redux-resources/robots', () => ({
  useRobot: vi.fn(),
}))
vi.mock('/app/redux/robot-auth', async importOriginal => {
  const actual = await importOriginal<Record<string, unknown>>()
  return {
    ...actual,
    useAccessTokenForRobot: vi.fn(() => 'token'),
    logOut: actual.logOut,
  }
})

const I18nWrapper: FunctionComponent<{ children: ReactNode }> = ({
  children,
}) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>

const wrapper = wrapWithDocumentationRequiredModal(I18nWrapper)

function mockQueries({
  accessControlEnabled = true,
  requireAdmin = true,
  accountType = 'user',
  username = 'alice',
  isLoading = false,
}: {
  accessControlEnabled?: boolean
  requireAdmin?: boolean
  accountType?: 'admin' | 'service' | 'user' | 'auditor'
  username?: string | null
  isLoading?: boolean
} = {}): void {
  vi.mocked(useAccessControlEnabledQuery).mockReturnValue({
    data: { data: { accessControlEnabled } },
    isLoading,
  } as ReturnType<typeof useAccessControlEnabledQuery>)
  vi.mocked(useAuthSettingsQuery).mockReturnValue({
    data: {
      data: { requireAdminCredsWhenUpdatingRobotSoftware: requireAdmin },
    },
    isLoading,
  } as ReturnType<typeof useAuthSettingsQuery>)
  vi.mocked(useSelfQuery).mockReturnValue({
    data:
      username == null
        ? undefined
        : { data: { username, accountType, fullName: 'Alice' } },
    isLoading,
  } as ReturnType<typeof useSelfQuery>)
}

describe('useRequireAdminForUpdates', () => {
  beforeEach(() => {
    mockDispatch.mockReset()
    mockMakeToast.mockClear()
    mockEatToast.mockClear()
    mockRemoveQueries.mockClear()
    vi.mocked(mockShowLoginModal).mockReset()
    vi.mocked(mockShowLoginModal).mockResolvedValue({ username: 'admin' })
    vi.mocked(useToaster).mockReturnValue({
      makeToast: mockMakeToast,
      eatToast: mockEatToast,
      makeSnackbar: vi.fn(),
    })
    vi.mocked(getIsOnDevice).mockReturnValue(false)
    vi.mocked(useHost).mockReturnValue(HOST)
    vi.mocked(useRobot).mockReturnValue({
      ip: HOST.hostname,
      port: HOST.port,
      name: ROBOT_NAME,
    } as ReturnType<typeof useRobot>)
    mockQueries()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('allows the update when access control is disabled', () => {
    mockQueries({ accessControlEnabled: false, accountType: 'user' })

    const { result } = renderHook(() => useRequireAdminForUpdates(ROBOT_NAME), {
      wrapper,
    })

    expect(result.current.ensureCanUpdate()).toBe(true)
    expect(mockDispatch).not.toHaveBeenCalled()
    expect(mockMakeToast).not.toHaveBeenCalled()
  })

  it('allows the update when admin credentials are not required', () => {
    mockQueries({ requireAdmin: false, accountType: 'user' })

    const { result } = renderHook(() => useRequireAdminForUpdates(ROBOT_NAME), {
      wrapper,
    })

    expect(result.current.ensureCanUpdate()).toBe(true)
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('allows admin and service accounts when admin credentials are required', () => {
    mockQueries({ accountType: 'admin' })
    const { result, rerender } = renderHook(
      () => useRequireAdminForUpdates(ROBOT_NAME),
      { wrapper }
    )
    expect(result.current.ensureCanUpdate()).toBe(true)

    mockQueries({ accountType: 'service' })
    rerender()
    expect(result.current.ensureCanUpdate()).toBe(true)
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('logs out, toasts, and prompts login for a regular user', () => {
    mockQueries({ accountType: 'user' })

    const { result } = renderHook(() => useRequireAdminForUpdates(ROBOT_NAME), {
      wrapper,
    })

    expect(result.current.ensureCanUpdate()).toBe(false)
    expect(mockDispatch).toHaveBeenCalledWith(logOut({ robotName: ROBOT_NAME }))
    expect(mockRemoveQueries).toHaveBeenCalledWith(getSelfQueryKey(HOST))
    expect(mockMakeToast).toHaveBeenCalledWith(
      'Log in with an authorized account.',
      WARNING_TOAST,
      expect.objectContaining({
        closeButton: true,
        disableTimeout: true,
        heading: 'Admin credentials required',
        zIndex: 10002,
      })
    )
    expect(mockShowLoginModal).toHaveBeenCalledWith(
      expect.objectContaining({
        robotName: ROBOT_NAME,
        uncloseable: true,
      })
    )
  })

  it('logs out an auditor when admin credentials are required', () => {
    mockQueries({ accountType: 'auditor' })

    const { result } = renderHook(() => useRequireAdminForUpdates(ROBOT_NAME), {
      wrapper,
    })

    expect(result.current.ensureCanUpdate()).toBe(false)
    expect(mockDispatch).toHaveBeenCalledWith(logOut({ robotName: ROBOT_NAME }))
    expect(mockMakeToast).toHaveBeenCalled()
  })

  it('returns false without logging out while auth queries are loading', () => {
    mockQueries({ isLoading: true })

    const { result } = renderHook(() => useRequireAdminForUpdates(ROBOT_NAME), {
      wrapper,
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.ensureCanUpdate()).toBe(false)
    expect(mockDispatch).not.toHaveBeenCalled()
    expect(mockMakeToast).not.toHaveBeenCalled()
  })

  it('does not auto-open login on ODD when logged out', () => {
    vi.mocked(getIsOnDevice).mockReturnValue(true)
    mockQueries({ username: null })

    const { result } = renderHook(() => useRequireAdminForUpdates(ROBOT_NAME), {
      wrapper,
    })

    expect(result.current.ensureCanUpdate()).toBe(false)
    expect(mockShowLoginModal).not.toHaveBeenCalled()
    expect(mockMakeToast).not.toHaveBeenCalled()
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('prompts desktop login without a toast when logged out', () => {
    mockQueries({ username: null })

    const { result } = renderHook(() => useRequireAdminForUpdates(ROBOT_NAME), {
      wrapper,
    })

    expect(result.current.ensureCanUpdate()).toBe(false)
    expect(mockShowLoginModal).toHaveBeenCalled()
    expect(mockMakeToast).not.toHaveBeenCalled()
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('returns false when robotName is null', () => {
    const { result } = renderHook(() => useRequireAdminForUpdates(null), {
      wrapper,
    })

    expect(result.current.ensureCanUpdate()).toBe(false)
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('eats the toast after a successful re-login', async () => {
    mockQueries({ accountType: 'user' })
    vi.mocked(fetchSelfQuery).mockResolvedValue({} as never)

    const { result } = renderHook(() => useRequireAdminForUpdates(ROBOT_NAME), {
      wrapper,
    })

    act(() => {
      result.current.ensureCanUpdate()
    })

    await waitFor(() => {
      expect(mockEatToast).toHaveBeenCalledWith('toast-id')
    })
  })
})
