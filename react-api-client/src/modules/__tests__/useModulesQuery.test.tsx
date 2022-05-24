import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook } from '@testing-library/react-hooks'
import {
  AttachedModules,
  getModules,
  mockModulesResponse,
} from '@opentrons/api-client'
import { useHost } from '../../api'
import { useModulesQuery } from '..'

import type { HostConfig, Response } from '@opentrons/api-client'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost')

const mockGetModules = getModules as jest.MockedFunction<typeof getModules>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const MODULES_RESPONSE = { data: mockModulesResponse } as AttachedModules

describe('useModulesQuery hook', () => {
  let wrapper: React.FunctionComponent<{}>

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{}> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    wrapper = clientProvider
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should return no data if no host', () => {
    when(mockUseHost).calledWith().mockReturnValue(null)

    const { result } = renderHook(useModulesQuery, { wrapper })

    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the getModules request fails', () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockGetModules).calledWith(HOST_CONFIG).mockRejectedValue('oh no')

    const { result } = renderHook(useModulesQuery, { wrapper })
    expect(result.current.data).toBeUndefined()
  })

  it('should return all current protocols', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockGetModules)
      .calledWith(HOST_CONFIG)
      .mockResolvedValue({
        data: MODULES_RESPONSE,
      } as Response<AttachedModules>)

    const { result, waitFor } = renderHook(useModulesQuery, { wrapper })

    await waitFor(() => result.current.data != null)

    expect(result.current.data).toEqual(MODULES_RESPONSE)
  })
})
