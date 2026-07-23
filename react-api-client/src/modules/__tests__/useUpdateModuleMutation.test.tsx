import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { updateModule } from '@opentrons/api-client'

import { useUpdateModuleMutation } from '..'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '../../accessControl/__fixtures__/documentationState'
import { useHost } from '../../api'
import { modulesQueryKey } from '../useModulesQuery'

import type * as React from 'react'
import type {
  HostConfig,
  Response,
  UpdateModuleResponse,
} from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const SERIAL_NUMBER = 'abc123'
const UPDATE_MODULE_RESPONSE: UpdateModuleResponse = {
  message: 'Successfully updated module abc123',
}

describe('useUpdateModuleMutation hook', () => {
  let wrapper: React.FunctionComponent<{ children: React.ReactNode }>
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
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
      () =>
        useUpdateModuleMutation(ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE),
      {
        wrapper,
      }
    )

    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the update module request fails', () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(updateModule).mockRejectedValue('oh no')

    const { result } = renderHook(
      () =>
        useUpdateModuleMutation(ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE),
      {
        wrapper,
      }
    )
    expect(result.current.data).toBeUndefined()
  })

  it('should update a module and invalidate the modules query when calling updateModule', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(updateModule).mockResolvedValue({
      data: UPDATE_MODULE_RESPONSE,
    } as Response<UpdateModuleResponse>)
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(
      () =>
        useUpdateModuleMutation(ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE),
      {
        wrapper,
      }
    )
    act(() => {
      result.current.updateModule(SERIAL_NUMBER)
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(UPDATE_MODULE_RESPONSE)
    })
    expect(updateModule).toHaveBeenCalledWith(
      HOST_CONFIG,
      SERIAL_NUMBER,
      expect.any(String)
    )
    expect(invalidateQueries).toHaveBeenCalledWith(modulesQueryKey(HOST_CONFIG))
  })
})
