import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getCACertPassword } from '@opentrons/api-client'

import { useCACertPasswordQuery } from '..'
import { useHost } from '../../api'

import type * as React from 'react'
import type {
  CACertPassword,
  HostConfig,
  Response,
} from '@opentrons/api-client'
import type { UseCACertPasswordQueryOptions } from '../useCACertPasswordQuery'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const PASSWORD_RESPONSE: CACertPassword = {
  data: {
    password: 'hello-there-friends',
    valid_from_utc: '2026-04-20T20:16:26.555797Z',
    valid_until_utc: '2026-04-20T20:16:56.555797Z',
  },
} as CACertPassword

describe('useCACertPassword hook', () => {
  let wrapper: React.FunctionComponent<
    { children: React.ReactNode } & UseCACertPasswordQueryOptions
  >

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<
      { children: React.ReactNode } & UseCACertPasswordQueryOptions
    > = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {' '}
        {children}{' '}
      </QueryClientProvider>
    )

    wrapper = clientProvider
  })

  it('should return no data if no host', () => {
    vi.mocked(useHost).mockReturnValue(null)

    const { result } = renderHook(() => useCACertPasswordQuery(), { wrapper })

    expect(result.current?.data).toBeUndefined()
  })

  it('should return no data if lights request fails', () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getCACertPassword).mockRejectedValue('oh no')

    const { result } = renderHook(() => useCACertPasswordQuery(), { wrapper })

    expect(result.current?.data).toBeUndefined()
  })

  it('should return lights response data', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getCACertPassword).mockResolvedValue({
      data: PASSWORD_RESPONSE,
    } as Response<CACertPassword>)

    const { result } = renderHook(() => useCACertPasswordQuery(), { wrapper })

    await waitFor(() => {
      expect(result.current?.data).toEqual(PASSWORD_RESPONSE)
    })
  })
})
