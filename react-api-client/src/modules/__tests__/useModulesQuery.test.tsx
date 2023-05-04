import { useModulesQuery } from '..'
import { useHost } from '../../api'
import {
  getModules,
  mockModulesResponse,
  v2MockModulesResponse,
} from '@opentrons/api-client'
import type { HostConfig, Response, Modules } from '@opentrons/api-client'
import { renderHook } from '@testing-library/react-hooks'
import { when, resetAllWhenMocks } from 'jest-when'
import * as React from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost')

const mockGetModules = getModules as jest.MockedFunction<typeof getModules>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const MODULES_RESPONSE = { data: mockModulesResponse } as Modules
const V2_MODULES_RESPONSE = { data: v2MockModulesResponse }

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
      } as Response<Modules>)

    const { result, waitFor } = renderHook(useModulesQuery, { wrapper })

    await waitFor(() => result.current.data != null)

    expect(result.current.data).toEqual(MODULES_RESPONSE)
  })
  it('should return an empty array if an old version of modules returns', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockGetModules)
      .calledWith(HOST_CONFIG)
      .mockResolvedValue({
        data: V2_MODULES_RESPONSE,
      } as Response<any>)

    const { result, waitFor } = renderHook(useModulesQuery, { wrapper })

    await waitFor(() => result.current.data != null)
    expect(result.current.data).toEqual({ data: [] })
  })
})
