import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook } from '@testing-library/react-hooks'
import { updateSubsystem } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useUpdateSubsystemMutation } from '..'

import type {
  HostConfig,
  Response,
  SubsystemUpdateProgressData,
} from '@opentrons/api-client'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost')

const mockUpdateSubsystem = updateSubsystem as jest.MockedFunction<
  typeof updateSubsystem
>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const SUBSYSTEM = 'pipette_left'
const SUBSYSTEM_UPDATE_RESPONSE = {
  data: {
    id: 'mockId',
    createdAt: '2023-08-05T13:34:51.012179+00:00',
    subsystem: 'pipette_left',
    updateStatus: 'updating',
    updateProgress: 50,
    updateError: '',
  },
} as SubsystemUpdateProgressData

describe('useUpdateSubsystemMutation hook', () => {
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

    const { result } = renderHook(() => useUpdateSubsystemMutation(), {
      wrapper,
    })

    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the get runs request fails', () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockUpdateSubsystem)
      .calledWith(HOST_CONFIG, SUBSYSTEM)
      .mockRejectedValue('oh no')

    const { result } = renderHook(() => useUpdateSubsystemMutation(), {
      wrapper,
    })
    expect(result.current.data).toBeUndefined()
  })

  it('should update subsystem a play run action when calling the playRun callback', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockUpdateSubsystem)
      .calledWith(HOST_CONFIG, SUBSYSTEM)
      .mockResolvedValue({
        data: SUBSYSTEM_UPDATE_RESPONSE,
      } as Response<SubsystemUpdateProgressData>)

    const { result, waitFor } = renderHook(() => useUpdateSubsystemMutation(), {
      wrapper,
    })
    act(() => result.current.updateSubsystem(SUBSYSTEM))

    await waitFor(() => result.current.data != null)

    expect(result.current.data).toEqual(SUBSYSTEM_UPDATE_RESPONSE)
  })
})
