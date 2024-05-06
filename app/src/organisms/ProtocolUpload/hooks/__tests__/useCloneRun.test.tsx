import * as React from 'react'
import { when } from 'vitest-when'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { describe, it, beforeEach, afterEach, vi, expect } from 'vitest'

import {
  useHost,
  useCreateRunMutation,
  useCreateProtocolAnalysisMutation,
} from '@opentrons/react-api-client'

import { useCloneRun } from '../useCloneRun'
import { useNotifyRunQuery } from '../../../../resources/runs'

import type { HostConfig } from '@opentrons/api-client'

vi.mock('@opentrons/react-api-client')
vi.mock('../../../../resources/runs')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const RUN_ID: string = 'run_id'

describe('useCloneRun hook', () => {
  let wrapper: React.FunctionComponent<{ children: React.ReactNode }>

  beforeEach(() => {
    when(vi.mocked(useHost)).calledWith().thenReturn(HOST_CONFIG)
    when(vi.mocked(useNotifyRunQuery))
      .calledWith(RUN_ID)
      .thenReturn({
        data: {
          data: {
            id: RUN_ID,
            protocolId: 'protocolId',
            labwareOffsets: 'someOffset',
            runTimeParameters: [],
          },
        },
      } as any)
    when(vi.mocked(useCreateRunMutation))
      .calledWith(expect.anything())
      .thenReturn({ createRun: vi.fn() } as any)
    vi.mocked(useCreateProtocolAnalysisMutation).mockReturnValue({
      createProtocolAnalysis: vi.fn(),
    } as any)

    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{
      children: React.ReactNode
    }> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    wrapper = clientProvider
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should return a function that when called, calls stop run with the run id', async () => {
    const mockCreateRun = vi.fn()
    vi.mocked(useCreateRunMutation).mockReturnValue({
      createRun: mockCreateRun,
    } as any)

    const { result } = renderHook(() => useCloneRun(RUN_ID), { wrapper })
    result.current && result.current.cloneRun()
    expect(mockCreateRun).toHaveBeenCalledWith({
      protocolId: 'protocolId',
      labwareOffsets: 'someOffset',
      runTimeParameterValues: {},
    })
  })
})
