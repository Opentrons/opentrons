import type * as React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { getPipettes } from '@opentrons/api-client'
import { useHost } from '../../api'
import { usePipettesQuery } from '..'

import type {
  GetPipettesParams,
  HostConfig,
  Pipettes,
  Response,
} from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const PIPETTES_RESPONSE: Pipettes = {
  left: {
    model: 'p10_single_v1',
    name: 'p10_single',
    tip_length: 0.0,
    mount_axis: 'z',
    plunger_axis: 'b',
    id: '123',
  },
  right: {
    model: 'p300_single_v1',
    name: 'p300_single',
    tip_length: 0.0,
    mount_axis: 'a',
    plunger_axis: 'c',
    id: '321',
  },
} as any

describe('usePipettesQuery hook', () => {
  let wrapper: React.FunctionComponent<
    { children: React.ReactNode } & GetPipettesParams
  >

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<
      { children: React.ReactNode } & GetPipettesParams
    > = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    wrapper = clientProvider
  })

  it('should return no data if no host', () => {
    vi.mocked(useHost).mockReturnValue(null)

    const { result } = renderHook(usePipettesQuery, { wrapper })

    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the getPipettes request fails', () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getPipettes).mockRejectedValue('oh no')

    const { result } = renderHook(usePipettesQuery, { wrapper })
    expect(result.current.data).toBeUndefined()
  })

  it('should return all current attached pipettes', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getPipettes).mockResolvedValue({
      data: PIPETTES_RESPONSE,
    } as Response<Pipettes>)

    const { result } = renderHook(usePipettesQuery, {
      wrapper,
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(PIPETTES_RESPONSE)
    })
  })
})
