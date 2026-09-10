import { Provider } from 'react-redux'
import { act, renderHook, waitFor } from '@testing-library/react'
import { legacy_createStore } from 'redux'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { OAUTH2_CLIENT_ID } from '@opentrons/api-client'

import { mockConnectableRobot } from '/app/redux/discovery/__fixtures__'
import { timeOutLogin } from '/app/redux/robot-auth'

import {
  isRefreshGrantRejected,
  useRefreshAccessTokenOnActivity,
} from '../useRefreshAccessTokenOnActivity'

import type { AxiosError } from 'axios'
import type { Store } from 'redux'
import type { FunctionComponent, ReactNode } from 'react'
import type { State } from '/app/redux/types'

const ROBOT_NAME = 'otie'
const REFRESH_TOKEN = 'refresh-token'

const mockGetOAuth2Token = vi.fn()
const mockUseRobot = vi.fn()
let capturedOnActivity: (() => void) | null = null

vi.mock('@opentrons/api-client', async importOriginal => {
  const actual = await importOriginal<Record<string, unknown>>()
  return {
    ...actual,
    getOAuth2Token: (...args: unknown[]) => mockGetOAuth2Token(...args),
  }
})

vi.mock('/app/redux-resources/robots', () => ({
  useRobot: (...args: unknown[]) => mockUseRobot(...args),
}))

vi.mock('/app/local-resources/dom-utils/hooks/useActivityListener', () => ({
  useActivityListener: (onActivity: () => void) => {
    capturedOnActivity = onActivity
  },
}))

vi.mock('/app/redux/shell/remote', () => ({
  appShellUSBRequestor: vi.fn(),
}))

function createAxiosError(
  status: number | undefined,
  data?: { error?: string }
): AxiosError {
  return {
    isAxiosError: true,
    name: 'AxiosError',
    message: 'Request failed',
    toJSON: () => ({}),
    response:
      status != null
        ? {
            status,
            statusText: 'Error',
            headers: {},
            config: {} as AxiosError['config'],
            data,
          }
        : undefined,
  } as AxiosError
}

function createState(): State {
  return {
    robotAuth: {
      mostRecentRobotName: ROBOT_NAME,
      perRobotAuthStates: {
        [ROBOT_NAME]: {
          user: {
            username: 'alice',
            fullName: 'Alice',
            accountType: 'user',
          },
          accessToken: 'access-token',
          refreshToken: REFRESH_TOKEN,
          expiresAt: Date.now() + 60_000,
        },
      },
    },
  } as State
}

describe('isRefreshGrantRejected', () => {
  it('returns true for HTTP 400 invalid_grant', () => {
    expect(
      isRefreshGrantRejected(createAxiosError(400, { error: 'invalid_grant' }))
    ).toBe(true)
  })

  it('returns true for HTTP 401', () => {
    expect(isRefreshGrantRejected(createAxiosError(401))).toBe(true)
  })

  it('returns false when there is no HTTP response', () => {
    expect(isRefreshGrantRejected(createAxiosError(undefined))).toBe(false)
  })

  it('returns false for non-axios errors', () => {
    expect(isRefreshGrantRejected(new Error('network down'))).toBe(false)
  })
})

describe('useRefreshAccessTokenOnActivity', () => {
  let store: Store<State>
  let wrapper: FunctionComponent<{ children: ReactNode }>

  beforeEach(() => {
    mockGetOAuth2Token.mockReset()
    mockUseRobot.mockReset()
    capturedOnActivity = null
    mockUseRobot.mockReturnValue({
      ...mockConnectableRobot,
      name: ROBOT_NAME,
    })
    const initialState = createState()
    store = legacy_createStore((state = initialState) => state)
    store.dispatch = vi.fn()
    wrapper = ({ children }) => <Provider store={store}>{children}</Provider>
  })

  it('refreshes the access token on activity', async () => {
    mockGetOAuth2Token.mockResolvedValue({
      data: {
        access_token: 'new-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'new-refresh-token',
      },
    })

    renderHook(() => {
      useRefreshAccessTokenOnActivity()
    }, { wrapper })

    expect(capturedOnActivity).not.toBeNull()
    await act(async () => {
      capturedOnActivity?.()
    })

    await waitFor(() => {
      expect(mockGetOAuth2Token).toHaveBeenCalledWith(
        expect.objectContaining({
          hostname: mockConnectableRobot.ip,
        }),
        {
          grant_type: 'refresh_token',
          refresh_token: REFRESH_TOKEN,
          client_id: OAUTH2_CLIENT_ID,
        }
      )
    })
    expect(store.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'robotAuth/refreshLogin',
        payload: expect.objectContaining({
          robotName: ROBOT_NAME,
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        }),
      })
    )
  })

  it('times out the login when the refresh grant is rejected', async () => {
    mockGetOAuth2Token.mockRejectedValue(
      createAxiosError(400, { error: 'invalid_grant' })
    )

    renderHook(() => {
      useRefreshAccessTokenOnActivity()
    }, { wrapper })

    await act(async () => {
      capturedOnActivity?.()
    })

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(
        timeOutLogin({ robotName: ROBOT_NAME })
      )
    })
  })

  it('does not time out the login on a transient network error', async () => {
    mockGetOAuth2Token.mockRejectedValue(createAxiosError(undefined))

    renderHook(() => {
      useRefreshAccessTokenOnActivity()
    }, { wrapper })

    await act(async () => {
      capturedOnActivity?.()
    })

    await waitFor(() => {
      expect(mockGetOAuth2Token).toHaveBeenCalled()
    })
    expect(store.dispatch).not.toHaveBeenCalledWith(
      timeOutLogin({ robotName: ROBOT_NAME })
    )
  })
})
