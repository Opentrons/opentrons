import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useUpdateSelf } from '../useUpdateSelf'

const mockPatchSelf = vi.fn()
const mockSubmitPassword = vi.fn()
const mockUseHost = vi.fn()
const mockUseSelector = vi.fn()

vi.mock('react-redux', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...(actual as Record<string, unknown>),
    useSelector: (selector: unknown) => mockUseSelector(selector),
  }
})

vi.mock('@opentrons/react-api-client', async importOriginal => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    useHost: () => mockUseHost(),
    useUpdateSelfMutation: () => ({
      updateSelf: mockPatchSelf,
      isLoading: false,
    }),
  }
})

vi.mock('../useOAuth2PasswordLogin', () => ({
  useOAuth2PasswordLogin: () => ({
    submitPassword: mockSubmitPassword,
    isAuthLoading: false,
  }),
}))

describe('useUpdateSelf', () => {
  const onSuccess = vi.fn()
  const onError = vi.fn()

  beforeEach(() => {
    mockPatchSelf.mockReset()
    mockSubmitPassword.mockReset()
    onSuccess.mockReset()
    onError.mockReset()
    mockUseHost.mockReturnValue({ hostname: 'localhost' })
    mockUseSelector.mockReturnValue('access-token')
    mockPatchSelf.mockResolvedValue({
      data: {
        username: 'alice',
        fullName: 'Alice',
        accountType: 'user',
        scopes: [],
        locked: false,
        resetPassword: false,
      },
    })
  })

  it('updates self then signs in with the new password', async () => {
    const { result } = renderHook(() => useUpdateSelf({ onSuccess, onError }))

    act(() => {
      result.current.updateSelf('alice', 'new-secret')
    })

    await waitFor(() => {
      expect(mockPatchSelf).toHaveBeenCalledWith({
        data: { password: 'new-secret' },
      })
    })
    expect(mockSubmitPassword).toHaveBeenCalledWith('alice', 'new-secret')
    expect(onError).not.toHaveBeenCalled()
  })

  it('reports not signed in when host or token is missing', () => {
    mockUseSelector.mockReturnValue(null)

    const { result } = renderHook(() => useUpdateSelf({ onSuccess, onError }))

    act(() => {
      result.current.updateSelf('alice', 'new-secret')
    })

    expect(onError).toHaveBeenCalledWith('Not signed in.')
    expect(mockPatchSelf).not.toHaveBeenCalled()
    expect(mockSubmitPassword).not.toHaveBeenCalled()
  })

  it('reports failure when update self request fails', async () => {
    mockPatchSelf.mockRejectedValue(new Error('network'))

    const { result } = renderHook(() => useUpdateSelf({ onSuccess, onError }))

    act(() => {
      result.current.updateSelf('alice', 'new-secret')
    })

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Failed to update password.')
    })
    expect(mockSubmitPassword).not.toHaveBeenCalled()
  })
})
