import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { QueryClient, QueryClientProvider, UseQueryResult } from 'react-query'
import { renderHook } from '@testing-library/react-hooks'
import { SESSION_TYPE_BASIC } from '@opentrons/js-api-client'
import { useHost } from '../../api'
import { useSessionsByTypeQuery } from '../useSessionsByTypeQuery'
import {
  useCreateSessionMutation,
  UseCreateSessionMutationResult,
} from '../useCreateSessionMutation'
import { useEnsureBasicSession } from '..'

import type { HostConfig, Sessions } from '@opentrons/js-api-client'

jest.mock('@opentrons/js-api-client')
jest.mock('../../api/useHost')
jest.mock('../useSessionsByTypeQuery')
jest.mock('../useCreateSessionMutation')

const mockUseSessionByTypeQuery = useSessionsByTypeQuery as jest.MockedFunction<
  typeof useSessionsByTypeQuery
>
const mockUseCreateSessionMutation = useCreateSessionMutation as jest.MockedFunction<
  typeof useCreateSessionMutation
>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const SESSIONS_RESPONSE = {
  data: [{ sessionType: 'basic', id: '1' }],
} as Sessions

describe('useEnsureBasicSession hook', () => {
  let wrapper: React.FunctionComponent<{}>

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{}> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    wrapper = clientProvider

    when(mockUseCreateSessionMutation)
      .calledWith({
        sessionType: SESSION_TYPE_BASIC,
      })
      .mockReturnValue({} as UseCreateSessionMutationResult)
  })
  afterEach(() => {
    resetAllWhenMocks()
  })
  it('should return an existing basic session if one already exists', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockUseSessionByTypeQuery)
      .calledWith({
        sessionType: SESSION_TYPE_BASIC,
      })
      .mockReturnValue({ data: SESSIONS_RESPONSE } as UseQueryResult<Sessions>)

    const mockCreateSession = jest.fn()

    when(mockUseCreateSessionMutation)
      .calledWith({
        sessionType: SESSION_TYPE_BASIC,
      })
      .mockReturnValue({
        createSession: mockCreateSession as any,
        isLoading: false,
        isError: false,
      } as UseCreateSessionMutationResult)

    const { result } = renderHook(useEnsureBasicSession, {
      wrapper,
    })
    expect(mockCreateSession).not.toHaveBeenCalled()
    expect(result.current).toEqual(SESSIONS_RESPONSE.data[0])
  })
  it('should create a new basic session when no basic session exists', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockUseSessionByTypeQuery)
      .calledWith({
        sessionType: SESSION_TYPE_BASIC,
      })
      .mockReturnValue({ data: undefined } as UseQueryResult<Sessions>)

    const mockCreateSession = jest.fn()

    when(mockUseCreateSessionMutation)
      .calledWith({
        sessionType: SESSION_TYPE_BASIC,
      })
      .mockReturnValue({
        createSession: mockCreateSession as any,
        isLoading: false,
        isError: false,
      } as UseCreateSessionMutationResult)

    renderHook(useEnsureBasicSession, {
      wrapper,
    })
    expect(mockCreateSession).toHaveBeenCalled()
  })
  it('should NOT try to create another basic session if one is in the process of being created', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockUseSessionByTypeQuery)
      .calledWith({
        sessionType: SESSION_TYPE_BASIC,
      })
      .mockReturnValue({ data: undefined } as UseQueryResult<Sessions>)

    const mockCreateSession = jest.fn()

    when(mockUseCreateSessionMutation)
      .calledWith({
        sessionType: SESSION_TYPE_BASIC,
      })
      .mockReturnValue({
        createSession: mockCreateSession as any,
        isLoading: true, // create session request is being processed
        isError: false,
      } as UseCreateSessionMutationResult)

    renderHook(useEnsureBasicSession, {
      wrapper,
    })
    expect(mockCreateSession).not.toHaveBeenCalled()
  })
  it('should NOT try to create another basic session if a previous request errored', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockUseSessionByTypeQuery)
      .calledWith({
        sessionType: SESSION_TYPE_BASIC,
      })
      .mockReturnValue({ data: undefined } as UseQueryResult<Sessions>)

    const mockCreateSession = jest.fn()

    when(mockUseCreateSessionMutation)
      .calledWith({
        sessionType: SESSION_TYPE_BASIC,
      })
      .mockReturnValue({
        createSession: mockCreateSession as any,
        isLoading: false,
        isError: true, // previous create session request failed
      } as UseCreateSessionMutationResult)

    renderHook(useEnsureBasicSession, {
      wrapper,
    })
    expect(mockCreateSession).not.toHaveBeenCalled()
  })
})
