import type * as React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { getMaintenanceRun } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useMaintenanceRunQuery } from '..'
import { MAINTENANCE_RUN_ID } from '../__fixtures__'

import type {
  HostConfig,
  Response,
  MaintenanceRun,
} from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const MAINTENANCE_RUN_RESPONSE = {
  data: { id: MAINTENANCE_RUN_ID },
} as MaintenanceRun

describe('useMaintenanceRunQuery hook', () => {
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

    const { result } = renderHook(
      () => useMaintenanceRunQuery(MAINTENANCE_RUN_ID),
      {
        wrapper,
      }
    )

    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the get maintenance run request fails', () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getMaintenanceRun).mockRejectedValue('oh no')

    const { result } = renderHook(
      () => useMaintenanceRunQuery(MAINTENANCE_RUN_ID),
      {
        wrapper,
      }
    )
    expect(result.current.data).toBeUndefined()
  })

  it('should return a maintenance run', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getMaintenanceRun).mockResolvedValue({
      data: MAINTENANCE_RUN_RESPONSE,
    } as Response<MaintenanceRun>)

    const { result } = renderHook(
      () => useMaintenanceRunQuery(MAINTENANCE_RUN_ID),
      {
        wrapper,
      }
    )

    await waitFor(() => {
      expect(result.current.data).toEqual(MAINTENANCE_RUN_RESPONSE)
    })
  })
})
