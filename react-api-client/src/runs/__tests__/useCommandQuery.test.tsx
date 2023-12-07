import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { getCommand } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useCommandQuery } from '..'

import type { CommandDetail, HostConfig, Response } from '@opentrons/api-client'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost')

const mockGetCommand = getCommand as jest.MockedFunction<typeof getCommand>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const RUN_ID = '1'
const COMMAND_ID = '2'
const COMMAND_RESPONSE = {
  data: { id: COMMAND_ID } as any,
  links: null,
} as CommandDetail

describe('useCommandQuery hook', () => {
  let wrapper: React.FunctionComponent<{ children: React.ReactNode }>

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{ children: React.ReactNode }> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    wrapper = clientProvider
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should return no data if no host', () => {
    when(mockUseHost).calledWith().mockReturnValue(null)

    const { result } = renderHook(() => useCommandQuery(RUN_ID, COMMAND_ID), {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the get runs request fails', () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockGetCommand)
      .calledWith(HOST_CONFIG, RUN_ID, COMMAND_ID)
      .mockRejectedValue('oh no')

    const { result } = renderHook(() => useCommandQuery(RUN_ID, COMMAND_ID), {
      wrapper,
    })
    expect(result.current.data).toBeUndefined()
  })

  it('should return a command', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockGetCommand)
      .calledWith(HOST_CONFIG, RUN_ID, COMMAND_ID)
      .mockResolvedValue({ data: COMMAND_RESPONSE } as Response<CommandDetail>)

    const { result } = renderHook(
      () => useCommandQuery(RUN_ID, COMMAND_ID),
      {
        wrapper,
      }
    )

    await waitFor(() => {
      expect(result.current.data).toEqual(COMMAND_RESPONSE)
    })
  })
})
