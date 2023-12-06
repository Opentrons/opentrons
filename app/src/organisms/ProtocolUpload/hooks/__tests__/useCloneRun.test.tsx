import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import {
  useRunQuery,
  useHost,
  useCreateRunMutation,
} from '@opentrons/react-api-client'
import { useCloneRun } from '../useCloneRun'

import type { HostConfig } from '@opentrons/api-client'

jest.mock('@opentrons/react-api-client')

const mockUseHost = useHost as jest.MockedFunction<typeof useHost>
const mockUseRunQuery = useRunQuery as jest.MockedFunction<typeof useRunQuery>
const mockUseCreateRunMutation = useCreateRunMutation as jest.MockedFunction<
  typeof useCreateRunMutation
>

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const RUN_ID: string = 'run_id'

describe('useCloneRun hook', () => {
  let wrapper: React.FunctionComponent<{children: React.ReactNode}>

  beforeEach(() => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockUseRunQuery)
      .calledWith(RUN_ID)
      .mockReturnValue({
        data: {
          data: {
            id: RUN_ID,
            protocolId: 'protocolId',
            labwareOffsets: 'someOffset',
          },
        },
      } as any)
    when(mockUseCreateRunMutation)
      .calledWith(expect.anything())
      .mockReturnValue({ createRun: jest.fn() } as any)

    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{children: React.ReactNode}> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    wrapper = clientProvider
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should return a function that when called, calls stop run with the run id', async () => {
    const mockCreateRun = jest.fn()
    mockUseCreateRunMutation.mockReturnValue({
      createRun: mockCreateRun,
    } as any)

    const { result } = renderHook(() => useCloneRun(RUN_ID), { wrapper })
    result.current && result.current.cloneRun()
    expect(mockCreateRun).toHaveBeenCalledWith({
      protocolId: 'protocolId',
      labwareOffsets: 'someOffset',
    })
  })
})
