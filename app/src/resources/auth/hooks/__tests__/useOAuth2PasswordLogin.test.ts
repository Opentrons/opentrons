import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { OAUTH2_CLIENT_ID } from '@opentrons/api-client'

import { useOAuth2PasswordLogin } from '../useOAuth2PasswordLogin'

import type {
  AuthUser,
  AuthUserResponse,
  getSelf,
  OAuth2TokenResponse,
  Response,
} from '@opentrons/api-client'

const mockGetOAuth2Token = vi.fn()
const mockGetSelf = vi.fn()
const mockUseHost = vi.fn()

let mutationOnSuccess:
  | ((
      data: Response<OAuth2TokenResponse>,
      variables: { grant_type: string; username: string }
    ) => void)
  | undefined

vi.mock('@opentrons/api-client', async importOriginal => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    getSelf: (...args: unknown[]) => mockGetSelf(...args),
  }
})

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@opentrons/react-api-client', async importOriginal => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    useHost: () => mockUseHost(),
    useGetOAuth2TokenMutation: (options: {
      onSuccess?: (
        data: Response<OAuth2TokenResponse>,
        variables: { grant_type: string; username: string }
      ) => void
    }) => {
      mutationOnSuccess = options.onSuccess
      return {
        getOAuth2Token: mockGetOAuth2Token,
        isLoading: false,
      }
    },
  }
})

const TOKEN_RESPONSE: OAuth2TokenResponse = {
  access_token: 'access-token',
  token_type: 'Bearer',
  expires_in: 3600,
  refresh_token: 'refresh-token',
}

describe('useOAuth2PasswordLogin', () => {
  const onSuccess = vi.fn()
  const onError = vi.fn()

  beforeEach(() => {
    mockGetOAuth2Token.mockReset()
    mockGetSelf.mockReset()
    mutationOnSuccess = undefined
    mockUseHost.mockReturnValue({ hostname: 'localhost' })
    onSuccess.mockReset()
    onError.mockReset()
    mockGetSelf.mockResolvedValue({
      data: {
        data: {
          username: 'alice',
          fullName: 'Alice',
          accountType: 'user',
          locked: false,
          resetPassword: false,
          resetPasswordReason: null,
        },
      } as AuthUserResponse,
    } as Awaited<ReturnType<typeof getSelf>>)
  })

  it('calls getOAuth2Token with ROPC body including client_id', () => {
    const { result } = renderHook(() =>
      useOAuth2PasswordLogin({ onSuccess, onError })
    )

    act(() => {
      result.current.submitPassword('alice', 'secret')
    })

    expect(mockGetOAuth2Token).toHaveBeenCalledWith({
      grant_type: 'password',
      username: 'alice',
      password: 'secret',
      client_id: OAUTH2_CLIENT_ID,
    })
  })

  it('fetches self after OAuth success and passes the user to onSuccess', async () => {
    const user: AuthUser = {
      username: 'alice',
      fullName: 'Alice',
      accountType: 'user',
      locked: false,
      resetPassword: true,
      resetPasswordReason: 'ADMIN_FORCED',
    }
    mockGetSelf.mockResolvedValue({
      data: { data: user } as AuthUserResponse,
    } as Awaited<ReturnType<typeof getSelf>>)

    renderHook(() => useOAuth2PasswordLogin({ onSuccess, onError }))

    act(() => {
      mutationOnSuccess?.(
        { data: TOKEN_RESPONSE } as Response<OAuth2TokenResponse>,
        { grant_type: 'password', username: 'alice' }
      )
    })

    await waitFor(() => {
      expect(mockGetSelf).toHaveBeenCalledWith({
        hostname: 'localhost',
        token: 'access-token',
      })
    })
    expect(onSuccess).toHaveBeenCalledWith('alice', user, TOKEN_RESPONSE)
    expect(onError).not.toHaveBeenCalled()
  })

  it('reports an error when fetching self fails after OAuth success', async () => {
    mockGetSelf.mockRejectedValue(new Error('network'))

    renderHook(() => useOAuth2PasswordLogin({ onSuccess, onError }))

    act(() => {
      mutationOnSuccess?.(
        { data: TOKEN_RESPONSE } as Response<OAuth2TokenResponse>,
        { grant_type: 'password', username: 'alice' }
      )
    })

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('login_error_incorrect')
    })
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
