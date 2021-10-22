// tests for the useHealth hooks
import * as React from 'react'
import { when } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook } from '@testing-library/react-hooks'

import { getHealth as mockGetHealth } from '@opentrons/api-client'
import { useHost as mockUseHost } from '../../api'
import { useHealth } from '..'

import type { HostConfig, Response, Health } from '@opentrons/api-client'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost')

const getHealth = mockGetHealth as jest.MockedFunction<typeof mockGetHealth>
const useHost = mockUseHost as jest.MockedFunction<typeof mockUseHost>

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const HEALTH_RESPONSE: Health = { name: 'robot-name' } as Health

describe('useHealth hook', () => {
  let wrapper: React.FunctionComponent<{}>

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{}> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    wrapper = clientProvider
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should return no data if no host', () => {
    when(useHost).calledWith().mockReturnValue(null)

    const { result } = renderHook(useHealth, { wrapper })

    expect(result.current).toBeUndefined()
  })

  it('should return no data if health request fails', () => {
    when(useHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(getHealth).calledWith(HOST_CONFIG).mockRejectedValue('oh no')

    const { result } = renderHook(useHealth, { wrapper })

    expect(result.current).toBeUndefined()
  })

  it('should return health response data', async () => {
    when(useHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(getHealth)
      .calledWith(HOST_CONFIG)
      .mockResolvedValue({ data: HEALTH_RESPONSE } as Response<Health>)

    const { result, waitFor } = renderHook(useHealth, { wrapper })

    await waitFor(() => result.current != null)

    expect(result.current).toEqual(HEALTH_RESPONSE)
  })
})
