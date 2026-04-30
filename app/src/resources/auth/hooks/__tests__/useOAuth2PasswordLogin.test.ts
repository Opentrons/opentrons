import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { OAUTH2_CLIENT_ID } from '@opentrons/api-client'

import { useOAuth2PasswordLogin } from '../useOAuth2PasswordLogin'

const mockGetOAuth2Token = vi.fn()

vi.mock('@opentrons/react-api-client', async importOriginal => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    useGetOAuth2TokenMutation: () => ({
      getOAuth2Token: mockGetOAuth2Token,
      isLoading: false,
    }),
  }
})

describe('useOAuth2PasswordLogin', () => {
  const onSuccess = vi.fn()
  const onError = vi.fn()

  beforeEach(() => {
    mockGetOAuth2Token.mockReset()
    onSuccess.mockReset()
    onError.mockReset()
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
})
