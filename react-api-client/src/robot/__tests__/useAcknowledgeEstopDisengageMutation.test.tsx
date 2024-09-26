import type * as React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { acknowledgeEstopDisengage } from '@opentrons/api-client'
import { useAcknowledgeEstopDisengageMutation } from '..'

import type { HostConfig, Response, EstopStatus } from '@opentrons/api-client'
import { useHost } from '../../api'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost.ts')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }

describe('useAcknowledgeEstopDisengageMutation hook', () => {
  let wrapper: React.FunctionComponent<{ children: React.ReactNode }>
  const updatedEstopPhysicalStatus: EstopStatus = {
    data: {
      status: 'disengaged',
      leftEstopPhysicalStatus: 'disengaged',
      rightEstopPhysicalStatus: 'disengaged',
    },
  }

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{
      children: React.ReactNode
    }> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    wrapper = clientProvider
  })

  it('should return no data when calling setEstopPhysicalStatus if the request fails', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(acknowledgeEstopDisengage).mockRejectedValue('oh no')
    const { result } = renderHook(
      () => useAcknowledgeEstopDisengageMutation(),
      { wrapper }
    )
    expect(result.current.data).toBeUndefined()
    result.current.acknowledgeEstopDisengage(null)
    await waitFor(() => {
      expect(result.current.data).toBeUndefined()
    })
  })

  it('should update a estop status when calling the setEstopPhysicalStatus with empty payload', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(acknowledgeEstopDisengage).mockResolvedValue({
      data: updatedEstopPhysicalStatus,
    } as Response<EstopStatus>)

    const { result } = renderHook(
      () => useAcknowledgeEstopDisengageMutation(),
      { wrapper }
    )
    act(() => result.current.acknowledgeEstopDisengage(null))
    await waitFor(() => {
      expect(result.current.data).toEqual(updatedEstopPhysicalStatus)
    })
  })
})
