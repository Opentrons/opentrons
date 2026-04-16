import { QueryClient, QueryClientProvider } from 'react-query'
import { Provider } from 'react-redux'
import { act, renderHook } from '@testing-library/react'
import { legacy_createStore } from 'redux'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { OAUTH2_CLIENT_ID } from '@opentrons/api-client'

import { useOAuth2PasswordLogin } from '../useOAuth2PasswordLogin'

import type { Store } from 'redux'
import type { FunctionComponent, ReactNode } from 'react'

const mockGetOAuth2Token = vi.fn()
const mockMakeSnackbar = vi.fn()

vi.mock('/app/organisms/ToasterOven', () => ({
  useToaster: () => ({ makeSnackbar: mockMakeSnackbar }),
}))

vi.mock('@opentrons/react-api-client', async importOriginal => {
  const actual = await importOriginal<typeof ReactApiClient>()
  return {
    ...actual,
    useGetOAuth2TokenMutation: () => ({
      getOAuth2Token: mockGetOAuth2Token,
      isLoading: false,
    }),
  }
})

const store: Store<any> = legacy_createStore(vi.fn(), {})

describe('useOAuth2PasswordLogin', () => {
  let wrapper: FunctionComponent<{ children: ReactNode }>
  const onSuccess = vi.fn()

  beforeEach(() => {
    const queryClient = new QueryClient()
    wrapper = ({ children }) => (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </Provider>
    )
    mockGetOAuth2Token.mockReset()
    mockMakeSnackbar.mockReset()
    onSuccess.mockReset()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('calls getOAuth2Token with ROPC body including client_id', () => {
    const { result } = renderHook(() => useOAuth2PasswordLogin({ onSuccess }), {
      wrapper,
    })

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

  it('trims username and password', () => {
    const { result } = renderHook(() => useOAuth2PasswordLogin({ onSuccess }), {
      wrapper,
    })

    act(() => {
      result.current.submitPassword('  alice  ', '  pwd  ')
    })

    expect(mockGetOAuth2Token).toHaveBeenCalledWith({
      grant_type: 'password',
      username: 'alice',
      password: 'pwd',
      client_id: OAUTH2_CLIENT_ID,
    })
  })
})
