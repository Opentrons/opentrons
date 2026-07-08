import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import {
  useCreateProtocolAnalysisMutation,
  useCreateRunMutation,
  useHost,
} from '@opentrons/react-api-client'

import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'

import { useCloneRun } from '../useCloneRun'
import { useNotifyRunQuery } from '../useNotifyRunQuery'

import type { FunctionComponent, ReactNode } from 'react'
import type { HostConfig, LabwareOffset } from '@opentrons/api-client'

vi.mock('@opentrons/react-api-client')
vi.mock('/app/resources/runs/useNotifyRunQuery')
vi.mock('/app/local-resources/access-control/useDocumentationState', () => ({
  useDocumentationState: () => ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
}))

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const RUN_ID_NO_RTP: string = 'run_id_no_rtp'
const RUN_ID_RTP: string = 'run_id_rtp'
const RUN_ID_DUPLICATE_OFFSETS: string = 'run_id_duplicate_offsets'

describe('useCloneRun hook', () => {
  let wrapper: FunctionComponent<{ children: ReactNode }>

  beforeEach(() => {
    when(vi.mocked(useHost)).calledWith().thenReturn(HOST_CONFIG)
    when(vi.mocked(useNotifyRunQuery))
      .calledWith(RUN_ID_NO_RTP)
      .thenReturn({
        data: {
          data: {
            id: RUN_ID_NO_RTP,
            protocolId: 'protocolId',
            labwareOffsets: [
              {
                definitionUri: 'uri1',
                locationSequence: [1, 2],
                offset: { x: 1, y: 1, z: 1 },
              },
            ],
            runTimeParameters: [
              {
                type: 'int',
                variableName: 'number_param',
                default: 1,
                value: 1,
              },
              {
                type: 'bool',
                variableName: 'boolean_param',
                default: true,
                value: true,
              },
            ],
          },
        },
      } as any)
    when(vi.mocked(useNotifyRunQuery))
      .calledWith(RUN_ID_RTP)
      .thenReturn({
        data: {
          data: {
            id: RUN_ID_RTP,
            protocolId: 'protocolId',
            labwareOffsets: [
              {
                definitionUri: 'uri1',
                locationSequence: [1, 2],
                offset: { x: 1, y: 1, z: 1 },
              },
            ],
            runTimeParameters: [
              {
                type: 'int',
                variableName: 'number_param',
                default: 1,
                value: 2,
              },
              {
                type: 'bool',
                variableName: 'boolean_param',
                default: true,
                value: false,
              },
              {
                type: 'csv_file',
                variableName: 'file_param',
                file: { id: 'fileId_123' },
              },
            ],
          },
        },
      } as any)

    const duplicateOffsets: LabwareOffset[] = [
      {
        definitionUri: 'uri1',
        locationSequence: [1, 2],
        offset: { x: 1, y: 1, z: 1 },
      },
      {
        definitionUri: 'uri2',
        locationSequence: [3, 4],
        offset: { x: 2, y: 2, z: 2 },
      },
      {
        definitionUri: 'uri1',
        locationSequence: [1, 2],
        offset: { x: 3, y: 3, z: 3 },
      },
    ] as any

    when(vi.mocked(useNotifyRunQuery))
      .calledWith(RUN_ID_DUPLICATE_OFFSETS)
      .thenReturn({
        data: {
          data: {
            id: RUN_ID_DUPLICATE_OFFSETS,
            protocolId: 'protocolId',
            labwareOffsets: duplicateOffsets,
            runTimeParameters: [],
          },
        },
      } as any)

    when(vi.mocked(useCreateRunMutation))
      .calledWith(expect.anything(), expect.anything())
      .thenReturn({ createRun: vi.fn() } as any)
    vi.mocked(useCreateProtocolAnalysisMutation).mockReturnValue({
      createProtocolAnalysis: vi.fn(),
    } as any)

    const queryClient = new QueryClient()
    const clientProvider: FunctionComponent<{
      children: ReactNode
    }> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    wrapper = clientProvider
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should return a function that when called, calls createRun run with the run id', async () => {
    const mockCreateRun = vi.fn()
    vi.mocked(useCreateRunMutation).mockReturnValue({
      createRun: mockCreateRun,
    } as any)

    const { result } = renderHook(() => useCloneRun(RUN_ID_NO_RTP), { wrapper })
    result.current && result.current.cloneRun()
    expect(mockCreateRun).toHaveBeenCalledWith({
      protocolId: 'protocolId',
      labwareOffsets: [
        {
          definitionUri: 'uri1',
          locationSequence: [1, 2],
          offset: { x: 1, y: 1, z: 1 },
        },
      ],
      runTimeParameterValues: {},
      runTimeParameterFiles: {},
    })
  })

  it('should return a function that when called, calls createRun run with runTimeParameterValues overrides', async () => {
    const mockCreateRun = vi.fn()
    vi.mocked(useCreateRunMutation).mockReturnValue({
      createRun: mockCreateRun,
    } as any)

    const { result } = renderHook(() => useCloneRun(RUN_ID_RTP), { wrapper })
    result.current && result.current.cloneRun()
    expect(mockCreateRun).toHaveBeenCalledWith({
      protocolId: 'protocolId',
      labwareOffsets: [
        {
          definitionUri: 'uri1',
          locationSequence: [1, 2],
          offset: { x: 1, y: 1, z: 1 },
        },
      ],
      runTimeParameterValues: {
        number_param: 2,
        boolean_param: false,
      },
      runTimeParameterFiles: {
        file_param: 'fileId_123',
      },
    })
  })

  it('should filter duplicate labware offsets and keep only the most recent ones', async () => {
    const mockCreateRun = vi.fn()
    vi.mocked(useCreateRunMutation).mockReturnValue({
      createRun: mockCreateRun,
    } as any)

    const { result } = renderHook(() => useCloneRun(RUN_ID_DUPLICATE_OFFSETS), {
      wrapper,
    })
    result.current && result.current.cloneRun()

    const expectedOffsets = [
      {
        definitionUri: 'uri2',
        locationSequence: [3, 4],
        offset: { x: 2, y: 2, z: 2 },
      },
      {
        definitionUri: 'uri1',
        locationSequence: [1, 2],
        offset: { x: 3, y: 3, z: 3 },
      },
    ]

    expect(mockCreateRun).toHaveBeenCalledWith({
      protocolId: 'protocolId',
      labwareOffsets: expectedOffsets,
      runTimeParameterValues: {},
      runTimeParameterFiles: {},
    })
  })

  it('should handle analysis trigger when specified', async () => {
    const mockCreateRun = vi.fn()
    const mockCreateProtocolAnalysis = vi.fn()

    vi.mocked(useCreateRunMutation).mockReturnValue({
      createRun: mockCreateRun,
    } as any)
    vi.mocked(useCreateProtocolAnalysisMutation).mockReturnValue({
      createProtocolAnalysis: mockCreateProtocolAnalysis,
    } as any)

    const { result } = renderHook(
      () => useCloneRun(RUN_ID_RTP, undefined, true),
      { wrapper }
    )
    result.current && result.current.cloneRun()

    expect(mockCreateProtocolAnalysis).toHaveBeenCalledWith({
      protocolKey: 'protocolId',
      runTimeParameterValues: {
        number_param: 2,
        boolean_param: false,
      },
      runTimeParameterFiles: {
        file_param: 'fileId_123',
      },
    })
  })
})
