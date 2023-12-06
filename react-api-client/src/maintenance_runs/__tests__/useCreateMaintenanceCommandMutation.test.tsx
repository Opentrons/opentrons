import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook } from '@testing-library/react'
import { createMaintenanceCommand } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useCreateMaintenanceCommandMutation } from '..'

import { MAINTENANCE_RUN_ID, mockAnonLoadCommand } from '../__fixtures__'

import type { HostConfig } from '@opentrons/api-client'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost')

const mockCreateMaintenanceCommand = createMaintenanceCommand as jest.MockedFunction<
  typeof createMaintenanceCommand
>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }

describe('useCreateMaintenanceCommandMutation hook', () => {
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
    when(mockCreateMaintenanceCommand)
      .calledWith(HOST_CONFIG, MAINTENANCE_RUN_ID, mockAnonLoadCommand, {})
      .mockResolvedValue({ data: 'something' } as any)

    const { result, waitFor } = renderHook(
      () => useCreateMaintenanceCommandMutation(),
      {
        wrapper,
      }
    )

    expect(result.current.data).toBeUndefined()
    act(() => {
      result.current.createMaintenanceCommand({
        maintenanceRunId: MAINTENANCE_RUN_ID,
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
    when(mockCreateMaintenanceCommand)
      .calledWith(HOST_CONFIG, MAINTENANCE_RUN_ID, mockAnonLoadCommand, {
        waitUntilComplete,
        timeout,
      })
      .mockResolvedValue({ data: 'something' } as any)

    const { result, waitFor } = renderHook(
      () => useCreateMaintenanceCommandMutation(),
      {
        wrapper,
      }
    )

    expect(result.current.data).toBeUndefined()
    act(() => {
      result.current.createMaintenanceCommand({
        maintenanceRunId: MAINTENANCE_RUN_ID,
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
