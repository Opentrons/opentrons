import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createLiveCommand } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useCreateLiveCommandMutation } from '../useCreateLiveCommandMutation'

import { mockAnonLoadCommand } from '../__fixtures__'

import type { HostConfig } from '@opentrons/api-client'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost')

const mockCreateLiveCommand = createLiveCommand as jest.MockedFunction<
  typeof createLiveCommand
>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }

describe('useCreateLiveCommandMutation hook', () => {
  let wrapper: React.FunctionComponent<{children: React.ReactNode}>

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{children: React.ReactNode}> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    wrapper = clientProvider
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should issue the given live command when callback is called', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockCreateLiveCommand)
      .calledWith(HOST_CONFIG, mockAnonLoadCommand, {})
      .mockResolvedValue({ data: 'something' } as any)

    const { result } = renderHook(
      () => useCreateLiveCommandMutation(),
      {
        wrapper,
      }
    )

    expect(result.current.data).toBeUndefined()
    act(() => {
      result.current.createLiveCommand({
        command: mockAnonLoadCommand,
      })
    })
    await waitFor(() => {
      expect(result.current.data).toBe('something')
    })
  })
  it('should pass waitUntilComplete and timeout through if given command', async () => {
    const waitUntilComplete = true
    const timeout = 2000
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockCreateLiveCommand)
      .calledWith(HOST_CONFIG, mockAnonLoadCommand, {
        waitUntilComplete,
        timeout,
      })
      .mockResolvedValue({ data: 'something' } as any)

    const { result } = renderHook(
      () => useCreateLiveCommandMutation(),
      {
        wrapper,
      }
    )

    expect(result.current.data).toBeUndefined()
    act(() => {
      result.current.createLiveCommand({
        command: mockAnonLoadCommand,
        waitUntilComplete,
        timeout,
      })
    })
    await waitFor(() => {
      expect(result.current.data).toBe('something')
    })
  })
})
