import type * as React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { getCurrentAllSubsystemUpdates } from '@opentrons/api-client'
import { useHost } from '../../api'

import { useCurrentAllSubsystemUpdatesQuery } from '../useCurrentAllSubsystemUpdatesQuery'

import type {
  CurrentSubsystemUpdate,
  CurrentSubsystemUpdates,
  HostConfig,
  Response,
} from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const CURRENT_SUBSYSTEM_UPDATES_RESPONSE = {
  data: [
    {
      id: 'mock_gantry_x',
      createdAt: '2023-07-24T14:15:22Z',
      subsystem: 'gantry_x',
      updateStatus: 'queued',
    } as CurrentSubsystemUpdate,
    {
      id: 'mock_pipette_left',
      createdAt: '2023-07-24T18:15:22Z',
      subsystem: 'pipette_left',
      updateStatus: 'updating',
    } as CurrentSubsystemUpdate,
  ],
} as CurrentSubsystemUpdates

describe('useAllCurrentSubsystemUpdateQuery', () => {
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

  it('should return no data if no host', () => {
    vi.mocked(useHost).mockReturnValue(null)
    const { result } = renderHook(() => useCurrentAllSubsystemUpdatesQuery(), {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the get current system updates request fails', () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getCurrentAllSubsystemUpdates).mockRejectedValue('oh no')

    const { result } = renderHook(() => useCurrentAllSubsystemUpdatesQuery(), {
      wrapper,
    })
    expect(result.current.data).toBeUndefined()
  })

  it('should return current subsystem updates', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getCurrentAllSubsystemUpdates).mockResolvedValue({
      data: CURRENT_SUBSYSTEM_UPDATES_RESPONSE,
    } as Response<CurrentSubsystemUpdates>)

    const { result } = renderHook(() => useCurrentAllSubsystemUpdatesQuery(), {
      wrapper,
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(CURRENT_SUBSYSTEM_UPDATES_RESPONSE)
    })
  })
})
