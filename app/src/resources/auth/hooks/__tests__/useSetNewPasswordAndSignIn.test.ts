import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useSetNewPasswordAndSignIn } from '../useSetNewPasswordAndSignIn'

const mockUpdateSelf = vi.fn()
const mockUseHost = vi.fn()

vi.mock('@opentrons/api-client', async importOriginal => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    updateSelf: (...args: unknown[]) => mockUpdateSelf(...args),
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
  })

  it('patches self with the new password', async () => {
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
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('alice')
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

    expect(onError).toHaveBeenCalledWith(
      'set_new_password_error_session_expired'
    )
    expect(mockUpdateSelf).not.toHaveBeenCalled()
  })

  it('reports when the password is missing a special character', async () => {
    mockUpdateSelf.mockRejectedValue({
      isAxiosError: true,
      response: {
        data: {
          errors: [{ id: 'passwordMissingSpecialCharacters' }],
        },
      },
    })

    const { result } = renderHook(() =>
      useSetNewPasswordAndSignIn({ onSuccess, onError })
    )

    act(() => {
      result.current.submitNewPassword('alice', 'password123')
    })

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        'desktop_password_missing_special_characters'
      )
    })
    expect(onSuccess).not.toHaveBeenCalled()
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
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
