import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook } from '@testing-library/react-hooks'
import { acknowledgeEstopDisengage } from '@opentrons/api-client'
import { useAcknowledgeEstopDisengageMutation } from '..'

import type { HostConfig, Response, EstopStatus } from '@opentrons/api-client'
import { useHost } from '../../api'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost.ts')

const mockAcknowledgeEstopDisengage = acknowledgeEstopDisengage as jest.MockedFunction<
  typeof acknowledgeEstopDisengage
>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>
const HOST_CONFIG: HostConfig = { hostname: 'localhost' }

describe('useAcknowledgeEstopDisengageMutation hook', () => {
  let wrapper: React.FunctionComponent<{}>
  const updatedEstopPhysicalStatus: EstopStatus = {
    data: {
      status: 'disengaged',
      leftEstopPhysicalStatus: 'disengaged',
      rightEstopPhysicalStatus: 'disengaged',
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
    when(mockAcknowledgeEstopDisengage)
      .calledWith(HOST_CONFIG)
      .mockRejectedValue('oh no')
    const { result, waitFor } = renderHook(
      () => useAcknowledgeEstopDisengageMutation(),
      { wrapper }
    )
    expect(result.current.data).toBeUndefined()
    result.current.acknowledgeEstopDisengage(null)
    await waitFor(() => {
      return result.current.status !== 'loading'
    })
    expect(result.current.data).toBeUndefined()
  })

  it('should update a estop status when calling the setEstopPhysicalStatus with empty payload', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockAcknowledgeEstopDisengage)
      .calledWith(HOST_CONFIG)
      .mockResolvedValue({
        data: updatedEstopPhysicalStatus,
      } as Response<EstopStatus>)

    const { result, waitFor } = renderHook(
      () => useAcknowledgeEstopDisengageMutation(),
      { wrapper }
    )
    act(() => result.current.acknowledgeEstopDisengage(null))
    await waitFor(() => result.current.data != null)
    expect(result.current.data).toEqual(updatedEstopPhysicalStatus)
  })
})
