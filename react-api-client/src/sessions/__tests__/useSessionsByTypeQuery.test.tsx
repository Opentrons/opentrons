import type * as React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { getSessions } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useSessionsByTypeQuery } from '..'

import type { HostConfig, Response, Sessions } from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const SESSIONS_RESPONSE = {
  data: [
    { sessionType: 'tipLengthCalibration', id: '1' },
    { sessionType: 'deckCalibration', id: '2' },
  ],
} as Sessions

describe('useSessionsByTypeQuery hook', () => {
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

    const { result } = renderHook(
      () => useSessionsByTypeQuery({ sessionType: 'tipLengthCalibration' }),
      { wrapper }
    )

    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the get sessions request fails', () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getSessions).mockRejectedValue('oh no')

    const { result } = renderHook(
      () => useSessionsByTypeQuery({ sessionType: 'tipLengthCalibration' }),
      { wrapper }
    )
    expect(result.current.data).toBeUndefined()
  })

  it('should return all sessions of the given type', async () => {
    const tipLengthCalSessions = {
      ...SESSIONS_RESPONSE,
      data: SESSIONS_RESPONSE.data.filter(
        session => session.sessionType === 'tipLengthCalibration'
      ),
    }

    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getSessions).mockResolvedValue({
      data: tipLengthCalSessions,
    } as Response<Sessions>)

    const { result } = renderHook(
      () => useSessionsByTypeQuery({ sessionType: 'tipLengthCalibration' }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.data).toEqual(tipLengthCalSessions)
    })
  })
})
