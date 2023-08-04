import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook } from '@testing-library/react-hooks'
import { getCurrentSubsystemUpdates } from '@opentrons/api-client'
import { useHost } from '../../api'

import { useCurrentSubsystemUpdateQuery } from '../useCurrentSubsystemUpdateQuery'

import type {
  CurrentSubsystemUpdates,
  CurrentSubsystemUpdate,
  HostConfig,
  Subsystem,
  SubsystemUpdateProgressData,
} from '@opentrons/api-client'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost')

const mockUseHost = useHost as jest.MockedFunction<typeof useHost>
const mockGetCurrentSubsystemUpdates = getCurrentSubsystemUpdates as jest.MockedFunction<
  typeof getCurrentSubsystemUpdates
>

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const SUBSYSTEM_TYPE = 'pipette_left'
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

const CURRENT_SUBSYSTEM_UPDATE_RESPONSE = {
  data: {
    id: 'mock_pipette_left',
    createdAt: '2023-07-24T18:15:22Z',
    subsystem: 'pipette_left',
    updateStatus: 'updating',
    updateProgress: 50,
    updateError: 'no error',
  },
} as SubsystemUpdateProgressData

describe('useCurrentSubsystemUpdateQuery', () => {
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
    const { result } = renderHook(() => useCurrentSubsystemUpdateQuery(null), {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the get current system updates request fails', () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockGetCurrentSubsystemUpdates)
      .calledWith(HOST_CONFIG, SUBSYSTEM_TYPE)
      .mockRejectedValue('oh no')

    const { result } = renderHook(
      () => useCurrentSubsystemUpdateQuery(SUBSYSTEM_TYPE),
      {
        wrapper,
      }
    )
    expect(result.current.data).toBeUndefined()
  })

  it('should return current subsystem updates', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockGetCurrentSubsystemUpdates)
      .calledWith(HOST_CONFIG, null)
      .mockResolvedValue({
        data: CURRENT_SUBSYSTEM_UPDATES_RESPONSE,
      } as any)

    const { result, waitFor } = renderHook(
      () => useCurrentSubsystemUpdateQuery(null),
      {
        wrapper,
      }
    )

    await waitFor(() => result.current.data != null)

    expect(result.current.data).toEqual(CURRENT_SUBSYSTEM_UPDATES_RESPONSE)
  })

  it('should return current subsystem update data', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockGetCurrentSubsystemUpdates)
      .calledWith(HOST_CONFIG, SUBSYSTEM_TYPE)
      .mockResolvedValue({
        data: CURRENT_SUBSYSTEM_UPDATE_RESPONSE,
      } as any)

    const { result, waitFor } = renderHook(
      () => useCurrentSubsystemUpdateQuery(SUBSYSTEM_TYPE),
      {
        wrapper,
      }
    )

    await waitFor(() => result.current.data != null)

    expect(result.current.data).toEqual(CURRENT_SUBSYSTEM_UPDATE_RESPONSE)
  })
})
