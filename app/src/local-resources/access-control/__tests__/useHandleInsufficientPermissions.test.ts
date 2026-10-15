import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { addRequestErrorListener, GET, POST } from '@opentrons/api-client'
import { getSelfQueryKey } from '@opentrons/react-api-client'

import { useLocalRobotName } from '/app/redux-resources/robots/hooks/useLocalRobotName'
import { getIsOnDevice } from '/app/redux/config'
import { logOut } from '/app/redux/robot-auth'

import { useHandleInsufficientPermissions } from '../useHandleInsufficientPermissions'
import { useInsufficientPermissionsToast } from '../useInsufficientPermissionsToast'

import type ReactRedux from 'react-redux'
import type { HostConfig, RequestErrorListener } from '@opentrons/api-client'

const mockDispatch = vi.fn()
const mockRemoveQueries = vi.fn()
const mockPopToast = vi.fn()
const mockUnsubscribe = vi.fn()
const LOGGED_IN_STATE = {
  robotAuth: { perRobotAuthStates: { otie: {} }, mostRecentRobotName: 'otie' },
}
let mockState: unknown = LOGGED_IN_STATE

vi.mock('@opentrons/api-client', async importOriginal => {
  const actual = await importOriginal<Record<string, unknown>>()
  return { ...actual, addRequestErrorListener: vi.fn() }
})
vi.mock('@opentrons/react-api-client', async importOriginal => {
  const actual = await importOriginal<Record<string, unknown>>()
  return { ...actual, getSelfQueryKey: vi.fn(() => ['self']) }
})
vi.mock('react-redux', async importOriginal => {
  const actual = await importOriginal<typeof ReactRedux>()
  return {
    ...actual,
    useDispatch: () => mockDispatch,
    useSelector: (selector: (state: unknown) => unknown) => selector(mockState),
  }
})
vi.mock('react-query', async importOriginal => {
  const actual = await importOriginal<Record<string, unknown>>()
  return {
    ...actual,
    useQueryClient: () => ({ removeQueries: mockRemoveQueries }),
  }
})
vi.mock('/app/redux/config', async importOriginal => {
  const actual = await importOriginal<Record<string, unknown>>()
  return { ...actual, getIsOnDevice: vi.fn(() => false) }
})
vi.mock('/app/redux-resources/robots/hooks/useLocalRobotName')
vi.mock('../useInsufficientPermissionsToast')

const DESKTOP_HOST: HostConfig = {
  hostname: '1.2.3.4',
  robotName: 'otie',
  token: 'token',
}
const ODD_HOST: HostConfig = { hostname: 'localhost', token: 'token' }

const insufficientScopeError = {
  isAxiosError: true,
  response: {
    status: 403,
    data: { requiredScopes: ['runs.write'], providedScopes: [] },
  },
}

function renderAndGetListener(): RequestErrorListener {
  renderHook(() => {
    useHandleInsufficientPermissions()
  })
  const [[listener]] = vi.mocked(addRequestErrorListener).mock.calls
  return listener
}

describe('useHandleInsufficientPermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockState = LOGGED_IN_STATE
    vi.mocked(addRequestErrorListener).mockReturnValue(mockUnsubscribe)
    vi.mocked(useInsufficientPermissionsToast).mockReturnValue({
      popToast: mockPopToast,
      eatToast: vi.fn(),
    })
    vi.mocked(useLocalRobotName).mockReturnValue('local-flex')
    vi.mocked(getIsOnDevice).mockReturnValue(false)
  })

  it('logs out of the request robot and toasts on a non-GET insufficient-scope 403', () => {
    const listener = renderAndGetListener()

    listener(insufficientScopeError, POST, DESKTOP_HOST)

    expect(mockDispatch).toHaveBeenCalledWith(logOut({ robotName: 'otie' }))
    expect(mockRemoveQueries).toHaveBeenCalledWith(
      getSelfQueryKey(DESKTOP_HOST)
    )
    expect(mockPopToast).toHaveBeenCalled()
  })

  it('logs out of the local robot on ODD when the host has no robotName', () => {
    vi.mocked(getIsOnDevice).mockReturnValue(true)
    const listener = renderAndGetListener()

    listener(insufficientScopeError, POST, ODD_HOST)

    expect(mockDispatch).toHaveBeenCalledWith(
      logOut({ robotName: 'local-flex' })
    )
    expect(mockPopToast).toHaveBeenCalled()
  })

  it('does not use the local robot on desktop when the host has no robotName', () => {
    const listener = renderAndGetListener()

    listener(insufficientScopeError, POST, ODD_HOST)

    expect(mockDispatch).not.toHaveBeenCalled()
    expect(mockPopToast).toHaveBeenCalled()
  })

  it('ignores GET requests', () => {
    const listener = renderAndGetListener()

    listener(insufficientScopeError, GET, DESKTOP_HOST)
    listener(insufficientScopeError, 'get', DESKTOP_HOST)

    expect(mockDispatch).not.toHaveBeenCalled()
    expect(mockPopToast).not.toHaveBeenCalled()
  })

  it('ignores 403s that are not insufficient-scope errors', () => {
    const listener = renderAndGetListener()

    listener(
      { isAxiosError: true, response: { status: 403, data: { errors: [] } } },
      POST,
      DESKTOP_HOST
    )

    expect(mockDispatch).not.toHaveBeenCalled()
    expect(mockPopToast).not.toHaveBeenCalled()
  })

  it('does not register a listener when not logged in to any robot', () => {
    mockState = {
      robotAuth: { perRobotAuthStates: {}, mostRecentRobotName: null },
    }

    renderHook(() => {
      useHandleInsufficientPermissions()
    })

    expect(addRequestErrorListener).not.toHaveBeenCalled()
  })

  it('unregisters the listener on unmount', () => {
    const { unmount } = renderHook(() => {
      useHandleInsufficientPermissions()
    })

    unmount()

    expect(mockUnsubscribe).toHaveBeenCalled()
  })
})
