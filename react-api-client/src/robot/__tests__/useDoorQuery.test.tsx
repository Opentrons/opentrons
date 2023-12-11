import * as React from 'react'
import { when } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'

import { getDoorStatus } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useDoorQuery } from '..'

import type { HostConfig, Response, DoorStatus } from '@opentrons/api-client'
import type { UseDoorQueryOptions } from '../useDoorQuery'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost')

const mockGetDoorStatus = getDoorStatus as jest.MockedFunction<
  typeof getDoorStatus
>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const DOOR_RESPONSE: DoorStatus = {
  data: { status: 'open', doorRequiredClosedForProtocol: true },
} as DoorStatus

describe('useDoorQuery hook', () => {
  let wrapper: React.FunctionComponent<
    { children: React.ReactNode } & UseDoorQueryOptions
  >

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<
      { children: React.ReactNode } & UseDoorQueryOptions
    > = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    wrapper = clientProvider
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should return no data if no host', () => {
    when(mockUseHost).calledWith().mockReturnValue(null)

    const { result } = renderHook(useDoorQuery, { wrapper })

    expect(result.current?.data).toBeUndefined()
  })

  it('should return no data if lights request fails', () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockGetDoorStatus).calledWith(HOST_CONFIG).mockRejectedValue('oh no')

    const { result } = renderHook(useDoorQuery, { wrapper })

    expect(result.current?.data).toBeUndefined()
  })

  it('should return lights response data', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockGetDoorStatus)
      .calledWith(HOST_CONFIG)
      .mockResolvedValue({ data: DOOR_RESPONSE } as Response<DoorStatus>)

    const { result } = renderHook(useDoorQuery, { wrapper })

    await waitFor(() => {
      expect(result.current?.data).toEqual(DOOR_RESPONSE)
    })
  })
})
