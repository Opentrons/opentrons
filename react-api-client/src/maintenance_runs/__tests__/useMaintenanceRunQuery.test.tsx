import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook } from '@testing-library/react'
import { getMaintenanceRun } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useMaintenanceRunQuery } from '..'
import { MAINTENANCE_RUN_ID } from '../__fixtures__'

import type {
  HostConfig,
  Response,
  MaintenanceRun,
} from '@opentrons/api-client'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost')

const mockGetMaintenanceRun = getMaintenanceRun as jest.MockedFunction<
  typeof getMaintenanceRun
>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const MAINTENANCE_RUN_RESPONSE = {
  data: { id: MAINTENANCE_RUN_ID },
} as MaintenanceRun

describe('useMaintenanceRunQuery hook', () => {
  let wrapper: React.FunctionComponent<{children: React.ReactNode}>

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

  it('should return no data if no host', () => {
    when(mockUseHost).calledWith().mockReturnValue(null)

    const { result } = renderHook(
      () => useMaintenanceRunQuery(MAINTENANCE_RUN_ID),
      {
        wrapper,
      }
    )

    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the get maintenance run request fails', () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockGetMaintenanceRun)
      .calledWith(HOST_CONFIG, MAINTENANCE_RUN_ID)
      .mockRejectedValue('oh no')

    const { result } = renderHook(
      () => useMaintenanceRunQuery(MAINTENANCE_RUN_ID),
      {
        wrapper,
      }
    )
    expect(result.current.data).toBeUndefined()
  })

  it('should return a maintenance run', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockGetMaintenanceRun)
      .calledWith(HOST_CONFIG, MAINTENANCE_RUN_ID)
      .mockResolvedValue({
        data: MAINTENANCE_RUN_RESPONSE,
      } as Response<MaintenanceRun>)

    const { result, waitFor } = renderHook(
      () => useMaintenanceRunQuery(MAINTENANCE_RUN_ID),
      {
        wrapper,
      }
    )

    await waitFor(() => result.current.data != null)

    expect(result.current.data).toEqual(MAINTENANCE_RUN_RESPONSE)
  })
})
