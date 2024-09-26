import type * as React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { updateRobotName } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useUpdateRobotNameMutation } from '..'

import type {
  HostConfig,
  Response,
  UpdatedRobotName,
} from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }

const UPDATE_ROBOT_NAME_RESPONSE = {
  name: 'mockRobotName',
}
const newRobotName = 'mockRobotName'

describe('useUpdatedRobotNameMutation, hook', () => {
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

  it('should return no data when calling updateRobotName if the request fails', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(updateRobotName).mockRejectedValue('error')

    const { result } = renderHook(() => useUpdateRobotNameMutation(), {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
    act(() => result.current.updateRobotName(newRobotName))
    await waitFor(() => {
      expect(result.current.data).toBeUndefined()
    })
  })

  it('should update a robot name when calling the useRobotName callback', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(updateRobotName).mockResolvedValue({
      data: UPDATE_ROBOT_NAME_RESPONSE,
    } as Response<UpdatedRobotName>)

    const { result } = renderHook(() => useUpdateRobotNameMutation(), {
      wrapper,
    })
    act(() => result.current.updateRobotName(newRobotName))

    await waitFor(() => {
      expect(result.current.data).toEqual(UPDATE_ROBOT_NAME_RESPONSE)
    })
  })
})
