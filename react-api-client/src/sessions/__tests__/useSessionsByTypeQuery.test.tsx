import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook } from '@testing-library/react'
import { getSessions } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useSessionsByTypeQuery } from '..'

import type { HostConfig, Response, Sessions } from '@opentrons/api-client'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost')

const mockGetSessions = getSessions as jest.MockedFunction<typeof getSessions>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const SESSIONS_RESPONSE = {
  data: [
    { sessionType: 'tipLengthCalibration', id: '1' },
    { sessionType: 'deckCalibration', id: '2' },
  ],
} as Sessions

describe('useSessionsByTypeQuery hook', () => {
  let wrapper: React.FunctionComponent<{children: React.ReactNode}>

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{children: React.ReactNode}> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    wrapper = clientProvider
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should return no data if no host', () => {
    when(mockUseHost).calledWith().mockReturnValue(null)

    const { result } = renderHook(
      () => useSessionsByTypeQuery({ sessionType: 'tipLengthCalibration' }),
      { wrapper }
    )

    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the get sessions request fails', () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockGetSessions)
      .calledWith(HOST_CONFIG, { session_type: 'tipLengthCalibration' })
      .mockRejectedValue('oh no')

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

    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockGetSessions)
      .calledWith(HOST_CONFIG, { session_type: 'tipLengthCalibration' })
      .mockResolvedValue({ data: tipLengthCalSessions } as Response<Sessions>)

    const { result, waitFor } = renderHook(
      () => useSessionsByTypeQuery({ sessionType: 'tipLengthCalibration' }),
      { wrapper }
    )

    await waitFor(() => result.current.data != null)

    expect(result.current.data).toEqual(tipLengthCalSessions)
  })
})
