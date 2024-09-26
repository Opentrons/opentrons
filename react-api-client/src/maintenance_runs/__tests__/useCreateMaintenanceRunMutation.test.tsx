import type * as React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createMaintenanceRun } from '@opentrons/api-client'
import { useHost } from '../../api'
import { mockMaintenanceRunResponse } from '../__fixtures__'
import { useCreateMaintenanceRunMutation } from '..'

import type {
  HostConfig,
  Response,
  MaintenanceRun,
} from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }

describe('useCreateMaintenanceRunMutation hook', () => {
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

  it('should return no data when calling createMaintenanceRun if the request fails', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(createMaintenanceRun).mockRejectedValue('oh no')

    const { result } = renderHook(() => useCreateMaintenanceRunMutation(), {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()

    await expect(() => result.current.createMaintenanceRun({})).rejects.toBe(
      'oh no'
    )
    expect(result.current.data).toBeUndefined()
  })

  it('should create a maintenance run when calling the createMaintenanceRun callback with basic run args', async () => {
    const mockOffset = {
      definitionUri: 'fakeDefURI',
      location: { slotName: '1' },
      vector: { x: 1, y: 2, z: 3 },
    }
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(createMaintenanceRun).mockResolvedValue({
      data: mockMaintenanceRunResponse,
    } as Response<MaintenanceRun>)

    const { result } = renderHook(() => useCreateMaintenanceRunMutation(), {
      wrapper,
    })
    act(() => {
      result.current.createMaintenanceRun({ labwareOffsets: [mockOffset] })
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(mockMaintenanceRunResponse)
    })
  })
})
