import type * as React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import {
  createSession,
  SESSION_TYPE_DECK_CALIBRATION,
} from '@opentrons/api-client'
import { useHost } from '../../api'
import { useCreateSessionMutation } from '..'

import type {
  HostConfig,
  Response,
  Session,
  CreateSessionData,
} from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const SESSION_ID = '1'
const SESSION_RESPONSE = {
  data: { sessionType: SESSION_TYPE_DECK_CALIBRATION, id: SESSION_ID },
} as Session

describe('useCreateSessionMutation hook', () => {
  let wrapper: React.FunctionComponent<{ children: React.ReactNode }>
  let createSessionData = {} as CreateSessionData

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{
      children: React.ReactNode
    }> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    createSessionData = { sessionType: SESSION_TYPE_DECK_CALIBRATION }

    wrapper = clientProvider
  })

  it('should return no data when calling createSession if the request fails', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(createSession).mockRejectedValue('oh no')

    const { result } = renderHook(
      () => useCreateSessionMutation(createSessionData),
      {
        wrapper,
      }
    )

    expect(result.current.data).toBeUndefined()
    result.current.createSession()
    await waitFor(() => {
      expect(result.current.data).toBeUndefined()
    })
  })

  it('should create a session when calling the createSession callback', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(createSession).mockResolvedValue({
      data: SESSION_RESPONSE,
    } as Response<Session>)

    const { result } = renderHook(
      () => useCreateSessionMutation(createSessionData),
      {
        wrapper,
      }
    )
    act(() => result.current.createSession())

    await waitFor(() => {
      expect(result.current.data).toEqual(SESSION_RESPONSE)
    })
  })
})
