import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook } from '@testing-library/react-hooks'
import { createMaintenanceRun } from '@opentrons/api-client'
import { useHost } from '../../api'
import { mockMaintenanceRunResponse } from '../__fixtures__'
import { useCreateMaintenanceRunMutation } from '..'

import type {
  HostConfig,
  Response,
  MaintenanceRun,
} from '@opentrons/api-client'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost')

const mockCreateMaintenanceRun = createMaintenanceRun as jest.MockedFunction<
  typeof createMaintenanceRun
>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }

describe('useCreateMaintenanceRunMutation hook', () => {
  let wrapper: React.FunctionComponent<{}>

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

  it('should return no data when calling createMaintenanceRun if the request fails', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockCreateMaintenanceRun)
      .calledWith(HOST_CONFIG, {})
      .mockRejectedValue('oh no')

    const { result, waitFor } = renderHook(
      () => useCreateMaintenanceRunMutation(),
      {
        wrapper,
      }
    )

    expect(result.current.data).toBeUndefined()
    result.current.createMaintenanceRun({})
    await waitFor(() => {
      console.log(result.current.status)
      return result.current.status !== 'loading'
    })
    expect(result.current.data).toBeUndefined()
  })

  it('should create a maintenance run when calling the createMaintenanceRun callback with basic run args', async () => {
    const mockOffset = {
      definitionUri: 'fakeDefURI',
      location: { slotName: '1' },
      vector: { x: 1, y: 2, z: 3 },
    }
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockCreateMaintenanceRun)
      .calledWith(HOST_CONFIG, { labwareOffsets: [mockOffset] })
      .mockResolvedValue({
        data: mockMaintenanceRunResponse,
      } as Response<MaintenanceRun>)

    const { result, waitFor } = renderHook(
      () => useCreateMaintenanceRunMutation(),
      {
        wrapper,
      }
    )
    act(() => {
      result.current.createMaintenanceRun({ labwareOffsets: [mockOffset] })
    })

    await waitFor(() => result.current.data != null)

    expect(result.current.data).toEqual(mockMaintenanceRunResponse)
  })
})
