import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook } from '@testing-library/react-hooks'
import {
  createRun,
  CreateRunData,
  RUN_TYPE_BASIC,
  RUN_TYPE_PROTOCOL,
} from '@opentrons/api-client'
import { useHost } from '../../api'
import {
  PROTOCOL_ID,
  mockBasicRunResponse,
  mockProtocolRunResponse,
} from '../__fixtures__'
import { useCreateRunMutation } from '..'

import type { HostConfig, Response, Run } from '@opentrons/api-client'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost')

const mockCreateRun = createRun as jest.MockedFunction<typeof createRun>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }

describe('useCreateRunMutation hook', () => {
  let wrapper: React.FunctionComponent<{}>
  let createRunData = {} as CreateRunData

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{}> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    createRunData = { runType: RUN_TYPE_BASIC }

    wrapper = clientProvider
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should return no data when calling createRun if the request fails', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockCreateRun)
      .calledWith(HOST_CONFIG, createRunData)
      .mockRejectedValue('oh no')

    const { result, waitFor } = renderHook(
      () => useCreateRunMutation(RUN_TYPE_BASIC),
      {
        wrapper,
      }
    )

    expect(result.current.data).toBeUndefined()
    result.current.createRun({})
    await waitFor(() => {
      console.log(result.current.status)
      return result.current.status !== 'loading'
    })
    expect(result.current.data).toBeUndefined()
  })

  it('should create a basic run when calling the createRun callback with basic run args', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockCreateRun)
      .calledWith(HOST_CONFIG, createRunData)
      .mockResolvedValue({ data: mockBasicRunResponse } as Response<Run>)

    const { result, waitFor } = renderHook(
      () => useCreateRunMutation(createRunData),
      {
        wrapper,
      }
    )
    act(() => result.current.createRun())

    await waitFor(() => result.current.data != null)

    expect(result.current.data).toEqual(mockBasicRunResponse)
  })

  it('should create a protocol run when calling the createRun callback with protocol run args', async () => {
    createRunData = {
      runType: RUN_TYPE_PROTOCOL,
      createParams: { protocolId: PROTOCOL_ID },
    }
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockCreateRun)
      .calledWith(HOST_CONFIG, createRunData)
      .mockResolvedValue({ data: mockProtocolRunResponse } as Response<Run>)

    const { result, waitFor } = renderHook(
      () => useCreateRunMutation(RUN_TYPE_BASIC),
      {
        wrapper,
      }
    )
    act(() => result.current.createRun({}))

    await waitFor(() => result.current.data != null)

    expect(result.current.data).toEqual(mockProtocolRunResponse)
  })
})
