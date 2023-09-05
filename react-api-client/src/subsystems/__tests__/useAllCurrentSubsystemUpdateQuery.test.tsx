import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook } from '@testing-library/react-hooks'
import { getCurrentAllSubsystemUpdates } from '@opentrons/api-client'
import { useHost } from '../../api'

import { useCurrentAllSubsystemUpdatesQuery } from '../useCurrentAllSubsystemUpdatesQuery'

import type {
  CurrentSubsystemUpdate,
  CurrentSubsystemUpdates,
  HostConfig,
  Response,
} from '@opentrons/api-client'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost')

const mockUseHost = useHost as jest.MockedFunction<typeof useHost>
const mockGetCurrentAllSubsystemUpdates = getCurrentAllSubsystemUpdates as jest.MockedFunction<
  typeof getCurrentAllSubsystemUpdates
>

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const CURRENT_SUBSYSTEM_UPDATES_RESPONSE = {
  data: [
    {
      id: 'mock_gantry_x',
      createdAt: '2023-07-24T14:15:22Z',
      subsystem: 'gantry_x',
      updateStatus: 'queued',
    } as CurrentSubsystemUpdate,
    {
      id: 'mock_pipette_left',
      createdAt: '2023-07-24T18:15:22Z',
      subsystem: 'pipette_left',
      updateStatus: 'updating',
    } as CurrentSubsystemUpdate,
  ],
} as CurrentSubsystemUpdates

describe('useAllCurrentSubsystemUpdateQuery', () => {
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

  it('should return no data if no host', () => {
    when(mockUseHost).calledWith().mockReturnValue(null)
    const { result } = renderHook(() => useCurrentAllSubsystemUpdatesQuery(), {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the get current system updates request fails', () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockGetCurrentAllSubsystemUpdates)
      .calledWith(HOST_CONFIG)
      .mockRejectedValue('oh no')

    const { result } = renderHook(() => useCurrentAllSubsystemUpdatesQuery(), {
      wrapper,
    })
    expect(result.current.data).toBeUndefined()
  })

  it('should return current subsystem updates', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockGetCurrentAllSubsystemUpdates)
      .calledWith(HOST_CONFIG)
      .mockResolvedValue({
        data: CURRENT_SUBSYSTEM_UPDATES_RESPONSE,
      } as Response<CurrentSubsystemUpdates>)

    const { result, waitFor } = renderHook(
      () => useCurrentAllSubsystemUpdatesQuery(),
      {
        wrapper,
      }
    )

    await waitFor(() => result.current.data != null)

    expect(result.current.data).toEqual(CURRENT_SUBSYSTEM_UPDATES_RESPONSE)
  })
})
