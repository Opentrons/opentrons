import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { QueryClient, QueryClientProvider, UseQueryResult } from 'react-query'
import { renderHook } from '@testing-library/react-hooks'
import { RUN_TYPE_BASIC } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useRunsByTypeQuery } from '../useRunsByTypeQuery'
import {
  useCreateRunMutation,
  UseCreateRunMutationResult,
} from '../useCreateRunMutation'
import { useEnsureBasicRun } from '..'

import type { HostConfig, RunData } from '@opentrons/api-client'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost')
jest.mock('../useRunsByTypeQuery')
jest.mock('../useCreateRunMutation')

const mockUseRunByTypeQuery = useRunsByTypeQuery as jest.MockedFunction<
  typeof useRunsByTypeQuery
>
const mockUseCreateRunMutation = useCreateRunMutation as jest.MockedFunction<
  typeof useCreateRunMutation
>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const RUNS_RESPONSE = [{ runType: 'basic', id: '1' }] as RunData[]

describe('useEnsureBasicRun hook', () => {
  let wrapper: React.FunctionComponent<{}>

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{}> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    wrapper = clientProvider

    when(mockUseCreateRunMutation)
      .calledWith({
        runType: RUN_TYPE_BASIC,
      })
      .mockReturnValue({} as UseCreateRunMutationResult)
  })
  afterEach(() => {
    resetAllWhenMocks()
  })
  it('should return an existing basic run if one already exists', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockUseRunByTypeQuery)
      .calledWith({
        runType: RUN_TYPE_BASIC,
      })
      .mockReturnValue({ data: RUNS_RESPONSE } as UseQueryResult<
        RunData[],
        Error
      >)

    const mockCreateRun = jest.fn()

    when(mockUseCreateRunMutation)
      .calledWith({
        runType: RUN_TYPE_BASIC,
      })
      .mockReturnValue({
        createRun: mockCreateRun as any,
        isLoading: false,
        isError: false,
      } as UseCreateRunMutationResult)

    const { result } = renderHook(useEnsureBasicRun, {
      wrapper,
    })
    expect(mockCreateRun).not.toHaveBeenCalled()
    expect(result.current).toEqual({ data: RUNS_RESPONSE[0], error: null })
  })
  it('should create a new basic run when no basic run exists', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockUseRunByTypeQuery)
      .calledWith({
        runType: RUN_TYPE_BASIC,
      })
      .mockReturnValue({ data: undefined } as UseQueryResult<RunData[], Error>)

    const mockCreateRun = jest.fn()

    when(mockUseCreateRunMutation)
      .calledWith({
        runType: RUN_TYPE_BASIC,
      })
      .mockReturnValue({
        createRun: mockCreateRun as any,
        isLoading: false,
        isError: false,
      } as UseCreateRunMutationResult)

    renderHook(useEnsureBasicRun, {
      wrapper,
    })
    expect(mockCreateRun).toHaveBeenCalled()
  })
  it('should NOT try to create another basic run if one is in the process of being created', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockUseRunByTypeQuery)
      .calledWith({
        runType: RUN_TYPE_BASIC,
      })
      .mockReturnValue({ data: undefined } as UseQueryResult<RunData[], Error>)

    const mockCreateRun = jest.fn()

    when(mockUseCreateRunMutation)
      .calledWith({
        runType: RUN_TYPE_BASIC,
      })
      .mockReturnValue({
        createRun: mockCreateRun as any,
        isLoading: true, // create run request is being processed
        isError: false,
      } as UseCreateRunMutationResult)

    renderHook(useEnsureBasicRun, {
      wrapper,
    })
    expect(mockCreateRun).not.toHaveBeenCalled()
  })
  it('should NOT try to create another basic run when there was an error getting the runs', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockUseRunByTypeQuery)
      .calledWith({
        runType: RUN_TYPE_BASIC,
      })
      .mockReturnValue({
        data: undefined,
        isError: true,
        error: 'some error getting the runs',
      } as any)

    const mockCreateRun = jest.fn()

    when(mockUseCreateRunMutation)
      .calledWith({
        runType: RUN_TYPE_BASIC,
      })
      .mockReturnValue({
        createRun: mockCreateRun as any,
        isLoading: false,
        isError: true, // previous create run request failed
      } as UseCreateRunMutationResult)

    const { result } = renderHook(useEnsureBasicRun, {
      wrapper,
    })
    expect(mockCreateRun).not.toHaveBeenCalled()
    expect(result.current).toEqual({
      data: null,
      error: 'some error getting the runs',
    })
  })
  it('should NOT try to create another basic run when there was an error creating the run', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockUseRunByTypeQuery)
      .calledWith({
        runType: RUN_TYPE_BASIC,
      })
      .mockReturnValue({
        data: undefined,
      } as any)

    const mockCreateRun = jest.fn()

    when(mockUseCreateRunMutation)
      .calledWith({
        runType: RUN_TYPE_BASIC,
      })
      .mockReturnValue({
        createRun: mockCreateRun as any,
        isLoading: false,
        isError: true,
        error: 'some error creating the run',
      } as any)

    const { result } = renderHook(useEnsureBasicRun, {
      wrapper,
    })
    expect(mockCreateRun).not.toHaveBeenCalled()
    expect(result.current).toEqual({
      data: null,
      error: 'some error creating the run',
    })
  })
})
