import type * as React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { getSubsystemUpdate } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useSubsystemUpdateQuery } from '..'

import type {
  HostConfig,
  Response,
  SubsystemUpdateProgressData,
} from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const UPDATE_ID = 'mockUpdateId'
const SUBSYSTEM_UPDATE_RESPONSE = {
  data: {
    id: 'mockUpdateId',
    createdAt: '2023-08-05T13:34:51.012179+00:00',
    subsystem: 'pipette_left',
    updateStatus: 'updating',
    updateProgress: 50,
    updateError: '',
  },
} as SubsystemUpdateProgressData

describe('useSubsystemUpdateQuery hook', () => {
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

    const { result } = renderHook(() => useSubsystemUpdateQuery(UPDATE_ID), {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the get subsystem update request fails', () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getSubsystemUpdate).mockRejectedValue('oh no')

    const { result } = renderHook(() => useSubsystemUpdateQuery(UPDATE_ID), {
      wrapper,
    })
    expect(result.current.data).toBeUndefined()
  })

  it('should return subsystem update', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getSubsystemUpdate).mockResolvedValue({
      data: SUBSYSTEM_UPDATE_RESPONSE,
    } as Response<SubsystemUpdateProgressData>)

    const { result } = renderHook(() => useSubsystemUpdateQuery(UPDATE_ID), {
      wrapper,
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(SUBSYSTEM_UPDATE_RESPONSE)
    })
  })
})
