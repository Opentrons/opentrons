import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook } from '@testing-library/react-hooks'
import { setEstopPhysicalStatus } from '@opentrons/api-client'
import { useSetEstopPhysicalStatusMutation } from '..'

import type { HostConfig, Response, EstopState } from '@opentrons/api-client'
import { useHost } from '../../api'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost.ts')

const mockSetEstopPhysicalStatus = setEstopPhysicalStatus as jest.MockedFunction<
  typeof setEstopPhysicalStatus
>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>
const HOST_CONFIG: HostConfig = { hostname: 'localhost' }

const UPDATE_ESTOP_PHYSICAL_STATUS_RESPONSE = {
  status: {},
}

describe('useSetEstopPhysicalStatusMutation hook', () => {
  let wrapper: React.FunctionComponent<{}>
  const updatedEstopPhysicalStatus: EstopState = {
    status: 'disengaged',
    estopPhysicalStatus: {
      status: 'disengaged',
    },
  }

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{}> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    wrapper = clientProvider
  })

  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should return no data when calling setEstopPhysicalStatus if the request fails', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockSetEstopPhysicalStatus)
      .calledWith(HOST_CONFIG, updatedEstopPhysicalStatus)
      .mockRejectedValue('oh no')
    const { result, waitFor } = renderHook(
      () => useSetEstopPhysicalStatusMutation(),
      { wrapper }
    )
    expect(result.current.data).toBeUndefined()
    result.current.setEstopPhysicalStatus(updatedEstopPhysicalStatus)
    await waitFor(() => {
      return result.current.status !== 'loading'
    })
    expect(result.current.data).toBeUndefined()
  })

  it('should update a estop status when calling the setEstopPhysicalStatus with empty payload', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockSetEstopPhysicalStatus)
      .calledWith(HOST_CONFIG, updatedEstopPhysicalStatus)
      .mockResolvedValue({
        data: updatedEstopPhysicalStatus,
      } as Response<EstopState>)

    const { result, waitFor } = renderHook(
      () => useSetEstopPhysicalStatusMutation(),
      { wrapper }
    )
    act(() => result.current.setEstopPhysicalStatus(updatedEstopPhysicalStatus))
    await waitFor(() => result.current.data != null)
    expect(result.current.data).toEqual(updatedEstopPhysicalStatus)
  })
})
