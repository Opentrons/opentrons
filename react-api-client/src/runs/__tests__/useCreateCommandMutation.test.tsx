import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook } from '@testing-library/react'
import { createCommand } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useCreateCommandMutation } from '..'

import { RUN_ID_1, mockAnonLoadCommand } from '../__fixtures__'

import type { HostConfig } from '@opentrons/api-client'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost')

const mockCreateCommand = createCommand as jest.MockedFunction<
  typeof createCommand
>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }

describe('useCreateCommandMutation hook', () => {
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

  it('should issue the given command to the given run when callback is called', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockCreateCommand)
      .calledWith(HOST_CONFIG, RUN_ID_1, mockAnonLoadCommand, {})
      .mockResolvedValue({ data: 'something' } as any)

    const { result, waitFor } = renderHook(() => useCreateCommandMutation(), {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
    act(() => {
      result.current.createCommand({
        runId: RUN_ID_1,
        command: mockAnonLoadCommand,
      })
    })
    await waitFor(() => {
      return result.current.data != null
    })
    expect(result.current.data).toBe('something')
  })
  it('should pass waitUntilComplete and timeout through if given command', async () => {
    const waitUntilComplete = true
    const timeout = 2000
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockCreateCommand)
      .calledWith(HOST_CONFIG, RUN_ID_1, mockAnonLoadCommand, {
        waitUntilComplete,
        timeout,
      })
      .mockResolvedValue({ data: 'something' } as any)

    const { result, waitFor } = renderHook(() => useCreateCommandMutation(), {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
    act(() => {
      result.current.createCommand({
        runId: RUN_ID_1,
        command: mockAnonLoadCommand,
        waitUntilComplete,
        timeout,
      })
    })
    await waitFor(() => {
      return result.current.data != null
    })
    expect(result.current.data).toBe('something')
  })
})
