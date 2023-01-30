import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook } from '@testing-library/react-hooks'
import { deleteCalData, DeleteCalRequestParams } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useDeleteCalDataMutation } from '..'
import type { HostConfig, Response, EmptyResponse } from '@opentrons/api-client'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost')

const mockDeleteCalData = deleteCalData as jest.MockedFunction<
  typeof deleteCalData
>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const DELETE_CAL_DATA_RESPONSE = {
  data: null,
} as EmptyResponse

describe('useDeleteCalDataMutation hook', () => {
  let wrapper: React.FunctionComponent<{}>
  const requestParams = {
    calType: 'pipetteOffset',
    mount: 'left',
    pipette_id: 'mockID',
  } as DeleteCalRequestParams

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

  it('should return no data when calling deleteProtocol if the request fails', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockDeleteCalData)
      .calledWith(HOST_CONFIG, requestParams)
      .mockRejectedValue('oh no')

    const { result, waitFor } = renderHook(() => useDeleteCalDataMutation(), {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
    result.current.deleteCalData(requestParams)
    await waitFor(() => {
      return result.current.status !== 'loading'
    })
    expect(result.current.data).toBeUndefined()
  })

  it('should delete calibration data when calling the deleteCalData callback', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockDeleteCalData)
      .calledWith(HOST_CONFIG, requestParams)
      .mockResolvedValue({
        data: DELETE_CAL_DATA_RESPONSE,
      } as Response<EmptyResponse>)

    const { result, waitFor } = renderHook(() => useDeleteCalDataMutation(), {
      wrapper,
    })
    act(() => result.current.deleteCalData(requestParams))

    await waitFor(() => result.current.data != null)

    expect(result.current.data).toEqual(DELETE_CAL_DATA_RESPONSE)
  })
})
