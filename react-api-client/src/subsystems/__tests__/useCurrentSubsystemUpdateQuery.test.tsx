import type * as React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { getCurrentSubsystemUpdate } from '@opentrons/api-client'
import { useHost } from '../../api'

import { useCurrentSubsystemUpdateQuery } from '../useCurrentSubsystemUpdateQuery'

import type {
  HostConfig,
  Response,
  SubsystemUpdateProgressData,
} from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const SUBSYSTEM_TYPE = 'pipette_left'
const CURRENT_SUBSYSTEM_UPDATE_RESPONSE = {
  data: {
    id: 'mock_pipette_left',
    createdAt: '2023-07-24T18:15:22Z',
    subsystem: 'pipette_left',
    updateStatus: 'updating',
    updateProgress: 50,
    updateError: 'no error',
  },
} as SubsystemUpdateProgressData

describe('useCurrentSubsystemUpdateQuery', () => {
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
    const { result } = renderHook(() => useCurrentSubsystemUpdateQuery(null), {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the get current system updates request fails', () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getCurrentSubsystemUpdate).mockRejectedValue('oh no')

    const { result } = renderHook(
      () => useCurrentSubsystemUpdateQuery(SUBSYSTEM_TYPE),
      {
        wrapper,
      }
    )
    expect(result.current.data).toBeUndefined()
  })

  it('should return current subsystem update data', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getCurrentSubsystemUpdate).mockResolvedValue({
      data: CURRENT_SUBSYSTEM_UPDATE_RESPONSE,
    } as Response<SubsystemUpdateProgressData>)

    const { result } = renderHook(
      () => useCurrentSubsystemUpdateQuery(SUBSYSTEM_TYPE),
      {
        wrapper,
      }
    )

    await waitFor(() => {
      expect(result.current.data).toEqual(CURRENT_SUBSYSTEM_UPDATE_RESPONSE)
    })
  })
})
