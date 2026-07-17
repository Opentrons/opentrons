import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { deleteMaintenanceRun } from '@opentrons/api-client'

import { useDeleteMaintenanceRunMutation } from '..'
import { MAINTENANCE_RUN_ID } from '../__fixtures__'
import { useHost } from '../../api'

import type * as React from 'react'
import type { EmptyResponse, HostConfig, Response } from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }

describe('useDeleteMaintenanceRunMutation hook', () => {
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

  it('should return no data when calling DeleteMaintenanceRun if the request fails', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(deleteMaintenanceRun).mockRejectedValue('oh no')

    const { result } = renderHook(
      () => useDeleteMaintenanceRunMutation({ accessControlEnabled: false }),
      {
        wrapper,
      }
    )

    expect(result.current.data).toBeUndefined()
    result.current.deleteMaintenanceRun(MAINTENANCE_RUN_ID)
    await waitFor(() => {
      expect(result.current.data).toBeUndefined()
    })
  })

  it('should delete a maintenance run when calling the deleteMaintenanceRun callback with basic run args', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(deleteMaintenanceRun).mockResolvedValue({
      data: { data: null },
    } as Response<EmptyResponse>)

    const { result } = renderHook(
      () => useDeleteMaintenanceRunMutation({ accessControlEnabled: false }),
      {
        wrapper,
      }
    )
    act(() => result.current.deleteMaintenanceRun(MAINTENANCE_RUN_ID))

    await waitFor(() => {
      expect(result.current.data).toEqual({ data: null })
    })
  })
})
