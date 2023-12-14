import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { getSession } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useSessionQuery } from '..'

import type { HostConfig, Response, Session } from '@opentrons/api-client'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost')

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>

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
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should return no data if no host', () => {
    when(mockUseHost).calledWith().mockReturnValue(null)

    const { result } = renderHook(() => useSessionQuery(SESSION_ID), {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the get sessions request fails', () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockGetSession)
      .calledWith(HOST_CONFIG, SESSION_ID)
      .mockRejectedValue('oh no')

    const { result } = renderHook(() => useSessionQuery(SESSION_ID), {
      wrapper,
    })
    expect(result.current.data).toBeUndefined()
  })

  it('should return a session', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockGetSession)
      .calledWith(HOST_CONFIG, SESSION_ID)
      .mockResolvedValue({ data: SESSION_RESPONSE } as Response<Session>)

    const { result } = renderHook(() => useSessionQuery(SESSION_ID), {
      wrapper,
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(SESSION_RESPONSE)
    })
  })
})
