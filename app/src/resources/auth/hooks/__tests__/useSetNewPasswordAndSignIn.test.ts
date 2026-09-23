import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DocumentedMutationError } from '@opentrons/react-api-client'

import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'

import { useSetNewPasswordAndSignIn } from '../useSetNewPasswordAndSignIn'

const mockUpdateSelf = vi.fn()
const mockUseHost = vi.fn()
const mockUseUpdateSelfMutation = vi.fn()

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
    useUpdateSelfMutation: (...args: unknown[]) =>
      mockUseUpdateSelfMutation(...args),
  }
})

describe('useSetNewPasswordAndSignIn', () => {
  const onSuccess = vi.fn()
  const onError = vi.fn()
  const host = { hostname: 'localhost', token: 'access-token' }

  beforeEach(() => {
    mockUpdateSelf.mockReset()
    mockUseUpdateSelfMutation.mockReset()
    onSuccess.mockReset()
    onError.mockReset()
    mockUseHost.mockReturnValue(host)
    mockUseUpdateSelfMutation.mockReturnValue({
      updateSelf: mockUpdateSelf,
      isLoading: false,
    })
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

  const renderSubject = (): {
    result: { current: ReturnType<typeof useSetNewPasswordAndSignIn> }
  } =>
    renderHook(() =>
      useSetNewPasswordAndSignIn(ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE, {
        onSuccess,
        onError,
      })
    )

  it('passes documentation state to useUpdateSelfMutation', () => {
    renderSubject()

    expect(mockUseUpdateSelfMutation).toHaveBeenCalledWith(
      ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE
    )
  })

  it('patches self with the new password', async () => {
    const { result } = renderSubject()

    act(() => {
      result.current.submitNewPassword('alice', 'new-secret')
    })

    await waitFor(() => {
      expect(mockUpdateSelf).toHaveBeenCalledWith({
        data: { password: 'new-secret' },
      })
    })
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('alice', 'new-secret')
    })
    expect(onError).not.toHaveBeenCalled()
  })

  it('reports not signed in when host or token is missing', () => {
    mockUseHost.mockReturnValue({ hostname: 'localhost' })

    const { result } = renderSubject()

    act(() => {
      result.current.submitNewPassword('alice', 'new-secret')
    })

    expect(onError).toHaveBeenCalledWith(
      'set_new_password_error_session_expired'
    )
    expect(mockUpdateSelf).not.toHaveBeenCalled()
  })

  it('reports when the password is too short', async () => {
    mockUpdateSelf.mockRejectedValue({
      isAxiosError: true,
      response: {
        data: {
          errors: [
            {
              id: 'passwordTooShort',
              meta: { requiredLength: 8, actualLength: 5 },
            },
          ],
        },
      },
    })

    const { result } = renderSubject()

    act(() => {
      result.current.submitNewPassword('alice', 'short')
    })

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('must_be_at_least_characters')
    })
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('reports when the password matches the current password', async () => {
    mockUpdateSelf.mockRejectedValue({
      isAxiosError: true,
      response: {
        data: {
          errors: [{ id: 'passwordPreviouslyUsed' }],
        },
      },
    })

    const { result } = renderSubject()

    act(() => {
      result.current.submitNewPassword('alice', 'same-as-current')
    })

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('desktop_password_previously_used')
    })
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('prefers the length error when both password policy errors are returned', async () => {
    mockUpdateSelf.mockRejectedValue({
      isAxiosError: true,
      response: {
        data: {
          errors: [
            { id: 'passwordMissingSpecialCharacters' },
            {
              id: 'passwordTooShort',
              meta: { requiredLength: 12, actualLength: 5 },
            },
          ],
        },
      },
    })

    const { result } = renderSubject()

    act(() => {
      result.current.submitNewPassword('alice', 'short')
    })

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('must_be_at_least_characters')
    })
    expect(onSuccess).not.toHaveBeenCalled()
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

    const { result } = renderSubject()

    act(() => {
      result.current.submitNewPassword('alice', 'password123')
    })

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        'must_include_at_least_one_special_character'
      )
    })
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('reports failure when patch self request fails', async () => {
    mockUpdateSelf.mockRejectedValue(new Error('network'))

    const { result } = renderSubject()

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

  it('does not report an error when the documentation modal is cancelled', async () => {
    mockUpdateSelf.mockRejectedValue(
      new DocumentedMutationError('no_documentation_report')
    )

    const { result } = renderSubject()

    act(() => {
      result.current.submitNewPassword('alice', 'new-secret')
    })

    await waitFor(() => {
      expect(mockUpdateSelf).toHaveBeenCalled()
    })
    expect(onError).not.toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
