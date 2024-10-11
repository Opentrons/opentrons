import type * as React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'
import {
  getPipetteSettings,
  pipetteSettingsResponseFixture,
} from '@opentrons/api-client'
import { useHost } from '../../api'
import { usePipetteSettingsQuery } from '..'

import type {
  HostConfig,
  PipetteSettings,
  Response,
} from '@opentrons/api-client'
import type { UsePipetteSettingsQueryOptions } from '../usePipetteSettingsQuery'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }

describe('usePipetteSettingsQuery hook', () => {
  let wrapper: React.FunctionComponent<
    { children: React.ReactNode } & UsePipetteSettingsQueryOptions
  >

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<
      { children: React.ReactNode } & UsePipetteSettingsQueryOptions
    > = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    wrapper = clientProvider
  })

  it('should return no data if no host', () => {
    vi.mocked(useHost).mockReturnValue(null)

    const { result } = renderHook(usePipetteSettingsQuery, { wrapper })

    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the getPipettes request fails', () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getPipetteSettings).mockRejectedValue('oh no')

    const { result } = renderHook(usePipetteSettingsQuery, { wrapper })
    expect(result.current.data).toBeUndefined()
  })

  it('should return all current attached pipettes', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getPipetteSettings).mockResolvedValue({
      data: pipetteSettingsResponseFixture as any,
    } as Response<PipetteSettings>)

    const { result } = renderHook(usePipetteSettingsQuery, {
      wrapper,
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(pipetteSettingsResponseFixture)
    })
  })
})
