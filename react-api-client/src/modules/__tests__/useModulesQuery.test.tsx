import type * as React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'
import {
  getModules,
  mockModulesResponse,
  mockUnknownModuleResponse,
  v2MockModulesResponse,
} from '@opentrons/api-client'
import { useHost } from '../../api'
import { useModulesQuery } from '..'

import type { HostConfig, Response, Modules } from '@opentrons/api-client'
import type { UseModulesQueryOptions } from '../useModulesQuery'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const MODULES_RESPONSE = {
  data: mockModulesResponse,
  meta: { totalLength: 0, cursor: 0 },
}
const UNKNOWN_MODULES_RESPONSE = {
  data: mockUnknownModuleResponse,
  meta: { totalLength: 0, cursor: 0 },
}
const V2_MODULES_RESPONSE = { data: v2MockModulesResponse }

describe('useModulesQuery hook', () => {
  let wrapper: React.FunctionComponent<
    { children: React.ReactNode } & UseModulesQueryOptions
  >

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<
      { children: React.ReactNode } & UseModulesQueryOptions
    > = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    wrapper = clientProvider
  })

  it('should return no data if no host', () => {
    vi.mocked(useHost).mockReturnValue(null)

    const { result } = renderHook(useModulesQuery, { wrapper })

    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the getModules request fails', () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getModules).mockRejectedValue('oh no')

    const { result } = renderHook(useModulesQuery, { wrapper })
    expect(result.current.data).toBeUndefined()
  })

  it('should return attached modules', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getModules).mockResolvedValue({
      data: MODULES_RESPONSE,
    } as Response<Modules>)

    const { result } = renderHook(useModulesQuery, { wrapper })

    await waitFor(() => {
      expect(result.current.data).toEqual(MODULES_RESPONSE)
    })
  })
  it('should filter out unknown modules', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getModules).mockResolvedValue({
      data: UNKNOWN_MODULES_RESPONSE,
    } as Response<any>)

    const { result } = renderHook(useModulesQuery, { wrapper })

    await waitFor(() => {
      expect(result.current.data).toEqual(MODULES_RESPONSE)
    })
  })

  it('should return an empty array if an old version of modules returns', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(getModules).mockResolvedValue({
      data: V2_MODULES_RESPONSE,
    } as Response<any>)

    const { result } = renderHook(useModulesQuery, { wrapper })

    await waitFor(() => {
      expect(result.current.data).toEqual({
        data: [],
        meta: { totalLength: 0, cursor: 0 },
      })
    })
  })
})
