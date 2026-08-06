import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useSetNewPasswordAndSignIn } from '../useSetNewPasswordAndSignIn'

const mockUpdateSelf = vi.fn()
const mockGetOAuth2Token = vi.fn()
const mockUseHost = vi.fn()

vi.mock('@opentrons/api-client', async importOriginal => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    updateSelf: (...args: unknown[]) => mockUpdateSelf(...args),
    getOAuth2Token: (...args: unknown[]) => mockGetOAuth2Token(...args),
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
  }
})

describe('useSetNewPasswordAndSignIn', () => {
  const onSuccess = vi.fn()
  const onError = vi.fn()
  const host = { hostname: 'localhost', token: 'access-token' }

  beforeEach(() => {
    mockUpdateSelf.mockReset()
    mockGetOAuth2Token.mockReset()
    onSuccess.mockReset()
    onError.mockReset()
    mockUseHost.mockReturnValue(host)
    mockUpdateSelf.mockResolvedValue({
      data: {
        username: 'alice',
        fullName: 'Alice',
        accountType: 'user',
        locked: false,
        resetPassword: false,
      },
    })
    mockGetOAuth2Token.mockResolvedValue({
      data: {
        token_type: 'Bearer',
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      },
    })
  })

  it('patches self then signs in with the new password', async () => {
    const { result } = renderHook(() =>
      useSetNewPasswordAndSignIn({ onSuccess, onError })
    )

    act(() => {
      result.current.submitNewPassword('alice', 'new-secret')
    })

    await waitFor(() => {
      expect(mockUpdateSelf).toHaveBeenCalledWith(
        host,
        {
          data: { password: 'new-secret' },
        },
        ''
      )
    })
    expect(mockGetOAuth2Token).toHaveBeenCalledWith(host, {
      grant_type: 'password',
      username: 'alice',
      password: 'new-secret',
      client_id: 'opentrons_app',
    })
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('alice', {
        token_type: 'Bearer',
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      })
    })
    expect(onError).not.toHaveBeenCalled()
  })

  it('reports not signed in when host or token is missing', () => {
    mockUseHost.mockReturnValue({ hostname: 'localhost' })

    const { result } = renderHook(() =>
      useSetNewPasswordAndSignIn({ onSuccess, onError })
    )

    act(() => {
      result.current.submitNewPassword('alice', 'new-secret')
    })

    expect(onError).toHaveBeenCalledWith('login_error_incorrect')
    expect(mockUpdateSelf).not.toHaveBeenCalled()
    expect(mockGetOAuth2Token).not.toHaveBeenCalled()
  })

  it('reports failure when patch self request fails', async () => {
    mockUpdateSelf.mockRejectedValue(new Error('network'))

    const { result } = renderHook(() =>
      useSetNewPasswordAndSignIn({ onSuccess, onError })
    )

    act(() => {
      result.current.submitNewPassword('alice', 'new-secret')
    })

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        'set_new_password_error_update_failed'
      )
    })
    expect(mockGetOAuth2Token).not.toHaveBeenCalled()
  })

  it('reports failure when sign in request fails', async () => {
    mockGetOAuth2Token.mockRejectedValue(new Error('network'))

    const { result } = renderHook(() =>
      useSetNewPasswordAndSignIn({ onSuccess, onError })
    )

    act(() => {
      result.current.submitNewPassword('alice', 'new-secret')
    })

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('login_error_unknown')
    })
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
