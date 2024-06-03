import { describe, it, vi, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAuth0 } from '@auth0/auth0-react'
import { useGetAccessToken } from '../useGetAccessToken'
import { AUTH0_AUDIENCE } from '../../constants'
import type { Mock } from 'vitest'

vi.mock('@auth0/auth0-react')

describe('useGetAccessToken', () => {
  it('should return access token when getAccessTokenSilently is successful', async () => {
    const mockGetAccessTokenSilently = vi
      .fn()
      .mockResolvedValue('mockAccessToken')
    ;(useAuth0 as Mock).mockReturnValue({
      getAccessTokenSilently: mockGetAccessTokenSilently,
    })

    const { result } = renderHook(() => useGetAccessToken())
    const { getAccessToken } = result.current
    const accessToken = getAccessToken()

    expect(mockGetAccessTokenSilently).toHaveBeenCalledWith({
      authorizationParams: {
        audience: AUTH0_AUDIENCE,
      },
    })
    expect(await accessToken).toBe('mockAccessToken')
  })

  it('should throw error when getAccessTokenSilently fails', async () => {
    const mockGetAccessTokenSilently = vi
      .fn()
      .mockRejectedValue(new Error('mockError'))
    ;(useAuth0 as Mock).mockReturnValue({
      getAccessTokenSilently: mockGetAccessTokenSilently,
    })
    const { result } = renderHook(() => useGetAccessToken())
    const { getAccessToken } = result.current
    const accessToken = getAccessToken()

    expect(mockGetAccessTokenSilently).toHaveBeenCalledWith({
      authorizationParams: {
        audience: AUTH0_AUDIENCE,
      },
    })
    await expect(accessToken).rejects.toThrow('mockError')
  })
})
