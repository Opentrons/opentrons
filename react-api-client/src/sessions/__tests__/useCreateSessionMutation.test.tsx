import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook } from '@testing-library/react-hooks'
import {
  createSession,
  CreateSessionData,
  SESSION_TYPE_BASIC,
} from '@opentrons/js-api-client'
import { useHost } from '../../api'
import { useCreateSessionMutation } from '..'

import type { HostConfig, Response, Session } from '@opentrons/js-api-client'

jest.mock('@opentrons/js-api-client')
jest.mock('../../api/useHost')

const mockCreateSession = createSession as jest.MockedFunction<
  typeof createSession
>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const SESSION_ID = '1'
const SESSION_RESPONSE = {
  data: { sessionType: SESSION_TYPE_BASIC, id: SESSION_ID },
} as Session

describe('useCreateSessionMutation hook', () => {
  let wrapper: React.FunctionComponent<{}>
  let createSessionData = {} as CreateSessionData

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{}> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    createSessionData = { sessionType: SESSION_TYPE_BASIC }

    wrapper = clientProvider
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should return no data when calling createSession if the request fails', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockCreateSession)
      .calledWith(HOST_CONFIG, createSessionData)
      .mockRejectedValue('oh no')

    const { result, waitFor } = renderHook(
      () => useCreateSessionMutation(createSessionData),
      {
        wrapper,
      }
    )

    expect(result.current.data).toBeUndefined()
    result.current.createSession()
    await waitFor(() => {
      console.log(result.current.status)
      return result.current.status !== 'loading'
    })
    expect(result.current.data).toBeUndefined()
  })

  it('should create a session when calling the createSession callback', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockCreateSession)
      .calledWith(HOST_CONFIG, createSessionData)
      .mockResolvedValue({ data: SESSION_RESPONSE } as Response<Session>)

    const { result, waitFor } = renderHook(
      () => useCreateSessionMutation(createSessionData),
      {
        wrapper,
      }
    )
    result.current.createSession()
    await waitFor(() => {
      expect(result.current.data).toEqual(SESSION_RESPONSE)
    })
  })
})
