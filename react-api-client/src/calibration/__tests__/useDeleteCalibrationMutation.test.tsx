import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import {
  deleteCalibration,
  DeleteCalRequestParams,
} from '@opentrons/api-client'
import { useHost } from '../../api'
import { useDeleteCalibrationMutation } from '..'
import type { HostConfig, Response, EmptyResponse } from '@opentrons/api-client'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost')

const mockDeleteCalibration = deleteCalibration as jest.MockedFunction<
  typeof deleteCalibration
>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const DELETE_CAL_DATA_RESPONSE = {
  data: null,
} as EmptyResponse

describe('useDeleteCalibrationMutation hook', () => {
  let wrapper: React.FunctionComponent<{children: React.ReactNode}>
  const requestParams = {
    calType: 'pipetteOffset',
    mount: 'left',
    pipette_id: 'mockID',
  } as DeleteCalRequestParams

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{children: React.ReactNode}> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    wrapper = clientProvider
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should return no data when calling deleteProtocol if the request fails', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockDeleteCalibration)
      .calledWith(HOST_CONFIG, requestParams)
      .mockRejectedValue('oh no')

    const { result } = renderHook(
      () => useDeleteCalibrationMutation(),
      {
        wrapper,
      }
    )

    expect(result.current.data).toBeUndefined()
    await act(() => result.current.deleteCalibration(requestParams))
    await waitFor(() => {
      return result.current.status !== 'loading'
    })
    expect(result.current.data).toBeUndefined()
  })

  it('should delete calibration data when calling the deleteCalibration callback', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockDeleteCalibration)
      .calledWith(HOST_CONFIG, requestParams)
      .mockResolvedValue({
        data: DELETE_CAL_DATA_RESPONSE,
      } as Response<EmptyResponse>)

    const { result, rerender } = renderHook(
      () => useDeleteCalibrationMutation(),
      {
        wrapper,
      }
    )
    await act(() => result.current.deleteCalibration(requestParams))
    await waitFor(() => {
      expect(result.current.data).not.toBeNull()
    })

    expect(result.current.data).toEqual(DELETE_CAL_DATA_RESPONSE)
  })
})
