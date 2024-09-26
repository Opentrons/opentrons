import type * as React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { updateSubsystem } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useUpdateSubsystemMutation } from '..'

import type {
  HostConfig,
  Response,
  SubsystemUpdateProgressData,
} from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const SUBSYSTEM = 'pipette_left'
const SUBSYSTEM_UPDATE_RESPONSE = {
  data: {
    id: 'mockId',
    createdAt: '2023-08-05T13:34:51.012179+00:00',
    subsystem: 'pipette_left',
    updateStatus: 'updating',
    updateProgress: 50,
    updateError: '',
  },
} as SubsystemUpdateProgressData

describe('useUpdateSubsystemMutation hook', () => {
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

    const { result } = renderHook(() => useUpdateSubsystemMutation(), {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the get runs request fails', () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(updateSubsystem).mockRejectedValue('oh no')

    const { result } = renderHook(() => useUpdateSubsystemMutation(), {
      wrapper,
    })
    expect(result.current.data).toBeUndefined()
  })

  it('should update subsystem a play run action when calling the playRun callback', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(updateSubsystem).mockResolvedValue({
      data: SUBSYSTEM_UPDATE_RESPONSE,
    } as Response<SubsystemUpdateProgressData>)

    const { result } = renderHook(() => useUpdateSubsystemMutation(), {
      wrapper,
    })
    act(() => result.current.updateSubsystem(SUBSYSTEM))

    await waitFor(() => {
      expect(result.current.data).toEqual(SUBSYSTEM_UPDATE_RESPONSE)
    })
  })
})
