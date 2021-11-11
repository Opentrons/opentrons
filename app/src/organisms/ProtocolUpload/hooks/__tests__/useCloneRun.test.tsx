import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { renderHook } from '@testing-library/react-hooks'
import { QueryClient, QueryClientProvider } from 'react-query'
import {
  useRunQuery,
  useHost,
  useStopRunMutation,
  useCreateRunMutation,
} from '@opentrons/react-api-client'
import { useCloneRun } from '../useCloneRun'

import type { HostConfig } from '@opentrons/api-client'

jest.mock('@opentrons/react-api-client')

const mockUseHost = useHost as jest.MockedFunction<typeof useHost>
const mockUseStopRunMutation = useStopRunMutation as jest.MockedFunction<
  typeof useStopRunMutation
>
const mockUseRunQuery = useRunQuery as jest.MockedFunction<typeof useRunQuery>
const mockUseCreateRunMutation = useCreateRunMutation as jest.MockedFunction<
  typeof useCreateRunMutation
>

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const RUN_ID: string = 'run_id'

describe('useCloneRun hook', () => {
  let wrapper: React.FunctionComponent<{}>

  beforeEach(() => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockUseRunQuery)
      .calledWith(RUN_ID)
      .mockReturnValue({ data: { data: { id: RUN_ID } } } as any)
    when(mockUseCreateRunMutation)
      .calledWith(expect.anything())
      .mockReturnValue({ createRun: jest.fn() } as any)

    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{}> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    wrapper = clientProvider
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should return a function that when called, calls stop run with the run id', async () => {
    const mockStopRun = jest.fn()
    mockUseStopRunMutation.mockReturnValue({ stopRun: mockStopRun } as any)

    const { result } = renderHook(() => useCloneRun(RUN_ID), { wrapper })
    result.current && result.current()
    expect(mockStopRun).toHaveBeenCalledWith(RUN_ID)
  })
})
