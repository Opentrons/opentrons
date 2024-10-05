import type * as React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { getSession } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useSessionQuery } from '..'

import type { HostConfig, Response, Session } from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const SESSION_ID = '1'
const SESSION_RESPONSE = {
  data: { sessionType: 'deckCalibration', id: SESSION_ID },
} as Session

describe('useSessionQuery hook', () => {
  let wrapper: React.FunctionComponent<{ children: React.ReactNode }>

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{
      children: React.ReactNode
    }> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    wrapper = clientProvider
  })

  it('should return no data if no host', () => {
    vi.mocked(useHost).mockReturnValue(null)

    const { result } = renderHook(() => useSessionQuery(SESSION_ID), {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the get sessions request fails', () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getSession).mockRejectedValue('oh no')

    const { result } = renderHook(() => useSessionQuery(SESSION_ID), {
      wrapper,
    })
    expect(result.current.data).toBeUndefined()
  })

  it('should return a session', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getSession).mockResolvedValue({
      data: SESSION_RESPONSE,
    } as Response<Session>)

    const { result } = renderHook(() => useSessionQuery(SESSION_ID), {
      wrapper,
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(SESSION_RESPONSE)
    })
  })
})
