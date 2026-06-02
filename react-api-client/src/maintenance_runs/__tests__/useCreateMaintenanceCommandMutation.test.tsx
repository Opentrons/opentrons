import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createMaintenanceCommand } from '@opentrons/api-client'

import { useCreateMaintenanceCommandMutation } from '..'
import { MAINTENANCE_RUN_ID, mockAnonLoadCommand } from '../__fixtures__'
import { useHost } from '../../api'

import type * as React from 'react'
import type { HostConfig } from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }

describe('useCreateMaintenanceCommandMutation hook', () => {
  let wrapper: React.FunctionComponent<{ children: React.ReactNode }>

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{
      children: React.ReactNode
    }> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    wrapper = clientProvider
  })

  it('should issue the given command to the given run when callback is called', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(createMaintenanceCommand).mockResolvedValue({
      data: 'something',
    } as any)

    const { result } = renderHook(
      () =>
        useCreateMaintenanceCommandMutation(
          { reasonForInteractionRequired: false },
          ['lpc_flow'],
          () => {}
        ),
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
      expect(result.current.data).toBe('something')
    })
  })
  it('should pass waitUntilComplete and timeout through if given command', async () => {
    const waitUntilComplete = true
    const timeout = 2000
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(createMaintenanceCommand).mockResolvedValue({
      data: 'something',
    } as any)

    const { result } = renderHook(
      () =>
        useCreateMaintenanceCommandMutation(
          { reasonForInteractionRequired: false },
          ['lpc_flow'],
          () => {}
        ),
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
      expect(result.current.data).toBe('something')
    })
  })
})
