import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createRunAction, RUN_ACTION_TYPE_PLAY } from '@opentrons/api-client'
import { useHost } from '../../api'
import { usePlayMaintenanceRunMutation } from '..'

import {
  MAINTENANCE_RUN_ID,
  mockPlayMaintenanceRunAction,
} from '../__fixtures__'

import type { HostConfig, Response, RunAction } from '@opentrons/api-client'
import type { UsePlayMaintenanceRunMutationOptions } from '../usePlayMaintenanceRunMutation'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost')

const mockCreateRunAction = createRunAction as jest.MockedFunction<
  typeof createRunAction
>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }

describe('usePlayMaintenanceRunMutation hook', () => {
  let wrapper: React.FunctionComponent<
    { children: React.ReactNode } & UsePlayMaintenanceRunMutationOptions
  >
  const createPlayRunActionData = { actionType: RUN_ACTION_TYPE_PLAY }

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<
      { children: React.ReactNode } & UsePlayMaintenanceRunMutationOptions
    > = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    wrapper = clientProvider
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should return no data when calling playRun if the request fails', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockCreateRunAction)
      .calledWith(HOST_CONFIG, MAINTENANCE_RUN_ID, createPlayRunActionData)
      .mockRejectedValue('oh no')

    const { result } = renderHook(usePlayMaintenanceRunMutation, {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
    act(() => result.current.playMaintenanceRun(MAINTENANCE_RUN_ID))
    await waitFor(() => {
      expect(result.current.data).toBeUndefined()
    })
  })

  it('should create a play run action when calling the playRun callback', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockCreateRunAction)
      .calledWith(HOST_CONFIG, MAINTENANCE_RUN_ID, createPlayRunActionData)
      .mockResolvedValue({
        data: mockPlayMaintenanceRunAction,
      } as Response<RunAction>)

    const { result } = renderHook(usePlayMaintenanceRunMutation, {
      wrapper,
    })
    act(() => result.current.playMaintenanceRun(MAINTENANCE_RUN_ID))

    await waitFor(() => {
      expect(result.current.data).toEqual(mockPlayMaintenanceRunAction)
    })
  })
})
