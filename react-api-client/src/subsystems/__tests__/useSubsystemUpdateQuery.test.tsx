import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook } from '@testing-library/react-hooks'
import { getSubsystemUpdate } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useSubsystemUpdateQuery } from '..'

import type {
  HostConfig,
  Response,
  SubsystemUpdateProgressData,
} from '@opentrons/api-client'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost')

const mockGetSubsystemUpdate = getSubsystemUpdate as jest.MockedFunction<
  typeof getSubsystemUpdate
>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const UPDATE_ID = 'mockUpdateId'
const SUBSYSTEM_UPDATE_RESPONSE = {
  data: {
    id: 'mockUpdateId',
    createdAt: '2023-08-05T13:34:51.012179+00:00',
    subsystem: 'pipette_left',
    updateStatus: 'updating',
    updateProgress: 50,
    updateError: '',
  },
} as SubsystemUpdateProgressData

describe('useSubsystemUpdateQuery hook', () => {
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

    const { result } = renderHook(() => useSubsystemUpdateQuery(UPDATE_ID), {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the get subsystem update request fails', () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockGetSubsystemUpdate)
      .calledWith(HOST_CONFIG, UPDATE_ID)
      .mockRejectedValue('oh no')

    const { result } = renderHook(() => useSubsystemUpdateQuery(UPDATE_ID), {
      wrapper,
    })
    expect(result.current.data).toBeUndefined()
  })

  it('should return subsystem update', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockGetSubsystemUpdate)
      .calledWith(HOST_CONFIG, UPDATE_ID)
      .mockResolvedValue({
        data: SUBSYSTEM_UPDATE_RESPONSE,
      } as Response<SubsystemUpdateProgressData>)

    const { result, waitFor } = renderHook(
      () => useSubsystemUpdateQuery(UPDATE_ID),
      {
        wrapper,
      }
    )

    await waitFor(() => result.current.data != null)

    expect(result.current.data).toEqual(SUBSYSTEM_UPDATE_RESPONSE)
  })
})
